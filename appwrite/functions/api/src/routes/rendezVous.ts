import {
  type Acteur,
  type ActionRendezVous,
  adresseManquante,
  appliquerAction,
  type Conge,
  type CreneauOccupe,
  cellules,
  creneauxLibres,
  type Disponibilite,
  dateLimiteReponse,
  dateLocale,
  type Fournisseur,
  JOURS_FERIES_TN,
  type Profil,
  type RendezVous,
  type ReponseApi,
  type Service,
  type StatutRendezVous,
  TABLES,
  versUtc,
} from '@fixa/core';
import {
  type Db,
  estConflit,
  type Ligne,
  libererCellules,
  STATUTS_LIBERANT,
  sousVerrou,
  supprimerCellules,
} from '@fixa/fn-commun';
import { echec, lire, succes } from '../reponse';

export type CorpsReservation = {
  fournisseurId: string;
  serviceId: string;
  debut: string;
  adresse: string;
  description: string;
};

export async function reserver(
  db: Db,
  acteur: Acteur,
  corps: CorpsReservation,
  maintenant: Date,
): Promise<ReponseApi<{ rendezVousId: string }>> {
  if (acteur.role !== 'client') return echec('NON_AUTORISE');
  const debutMs = Date.parse(corps.debut);
  if (Number.isNaN(debutMs)) return echec('REQUETE_INVALIDE');
  const debut = new Date(debutMs).toISOString();

  const [service, fournisseur] = await Promise.all([
    db.getRow<Service>(TABLES.services, corps.serviceId),
    db.getRow<Fournisseur>(TABLES.fournisseurs, corps.fournisseurId),
  ]);
  if (!service || !fournisseur) return echec('INTROUVABLE');
  if (service.fournisseurId !== fournisseur.$id) return echec('REQUETE_INVALIDE');
  if (!fournisseur.visible || !service.estVisible) return echec('FOURNISSEUR_INDISPONIBLE');
  if (adresseManquante(service, corps.adresse)) return echec('ADRESSE_REQUISE');

  const jour = dateLocale(debut);
  const [disponibilites, conges, occupees] = await Promise.all([
    db.listRows<Disponibilite & Ligne>(TABLES.disponibilites, {
      egal: { fournisseurId: fournisseur.$id },
    }),
    db.listRows<Conge & Ligne>(TABLES.conges, { egal: { fournisseurId: fournisseur.$id } }),
    db.listRows<CreneauOccupe>(TABLES.creneauxOccupes, {
      egal: { fournisseurId: fournisseur.$id },
      entre: { champ: 'cellule', min: versUtc(jour, '00:00'), max: versUtc(jour, '23:59') },
      limite: 100,
    }),
  ]);
  const libres = creneauxLibres({
    jour,
    dureeMin: service.duree,
    disponibilites,
    conges,
    joursFeries: JOURS_FERIES_TN,
    occupees: occupees.map((c) => c.cellule),
    maintenant,
  });
  if (!libres.includes(debut)) return echec('CRENEAU_PRIS');

  // The unique index on (fournisseurId, cellule) is the lock: the first writer of a cell wins.
  const rendezVousId = db.nouvelId();
  const creees: string[] = [];
  try {
    for (const cellule of cellules(debut, service.duree)) {
      const id = db.nouvelId();
      await db.createRow<CreneauOccupe>(TABLES.creneauxOccupes, id, {
        fournisseurId: fournisseur.$id,
        cellule,
        rendezVousId,
      });
      creees.push(id);
    }
  } catch (e) {
    await supprimerCellules(db, creees);
    if (estConflit(e)) return echec('CRENEAU_PRIS');
    throw e;
  }

  try {
    const client = await db.getRow<Profil>(TABLES.profils, acteur.id);
    await db.createRow<RendezVous>(
      TABLES.rendezVous,
      rendezVousId,
      {
        clientId: acteur.id,
        fournisseurId: fournisseur.$id,
        serviceId: service.$id,
        serviceTitre: service.titre,
        typePrix: service.typePrix,
        prix: service.prix,
        duree: service.duree,
        debut,
        // The provider only needs the client's address when going there.
        adresse: service.aDomicile ? corps.adresse.trim() : '',
        description: corps.description,
        estUrgent: false,
        source: 'APP',
        statut: 'EN_ATTENTE',
        dateLimiteReponse: dateLimiteReponse(maintenant, new Date(debut)).toISOString(),
        motif: null,
        annulePar: null,
        annulationTardive: false,
        clientNom: client ? `${client.prenom} ${client.nom}` : '',
        clientTelephone: client?.telephone ?? '',
        fournisseurNom: fournisseur.nom,
        aAvis: false,
        dernierStatutNotifie: null,
      },
      [lire(acteur.id), lire(fournisseur.$id)],
    );
  } catch (e) {
    await supprimerCellules(db, creees);
    throw e;
  }
  return succes({ rendezVousId });
}

export async function changerStatut(
  db: Db,
  acteur: Acteur,
  rendezVousId: string,
  action: Exclude<ActionRendezVous, 'expirer'>,
  corps: { motif?: string },
  maintenant: Date,
): Promise<ReponseApi<{ statut: StatutRendezVous }>> {
  const rdv = await db.getRow<RendezVous>(TABLES.rendezVous, rendezVousId);
  if (!rdv) return echec('INTROUVABLE');
  // A release that failed halfway is finished by the next call on the booking.
  if (STATUTS_LIBERANT.includes(rdv.statut)) await libererCellules(db, rendezVousId);
  const resultat = appliquerAction(rdv, action, acteur, maintenant);
  if (!resultat.ok) return echec(resultat.code);

  const change = () =>
    db.updateRow<RendezVous>(TABLES.rendezVous, rendezVousId, {
      statut: resultat.statut,
      motif: corps.motif ?? rdv.motif ?? null,
      ...(action === 'annuler'
        ? {
            annulePar: acteur.role === 'client' ? 'client' : 'fournisseur',
            annulationTardive: resultat.annulationTardive,
          }
        : {}),
    });
  if (!(await sousVerrou(db, rdv, resultat.statut, acteur.role, change))) {
    return echec('TRANSITION_INVALIDE');
  }

  if (STATUTS_LIBERANT.includes(resultat.statut)) await libererCellules(db, rendezVousId);
  return succes({ statut: resultat.statut });
}
