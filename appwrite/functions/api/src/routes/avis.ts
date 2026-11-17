import {
  type Acteur,
  type Avis,
  CRITERES_AVIS,
  type Fournisseur,
  moyenneApresAvis,
  type RendezVous,
  type ReponseApi,
  TABLES,
} from '@fixa/core';
import { type Db, estConflit } from '@fixa/fn-commun';
import { echec, succes } from '../reponse';

export type CorpsAvis = {
  rendezVousId: string;
  note: 1 | 2 | 3 | 4 | 5;
  criteres: string[];
  commentaire: string;
};

const COMMENTAIRE_MAX = 1000;

export async function publierAvis(
  db: Db,
  acteur: Acteur,
  corps: CorpsAvis,
): Promise<ReponseApi<{ avisId: string }>> {
  const noteValide = Number.isInteger(corps.note) && corps.note >= 1 && corps.note <= 5;
  const criteresValides = corps.criteres.every((c) => CRITERES_AVIS.includes(c));
  if (!noteValide || !criteresValides || corps.commentaire.length > COMMENTAIRE_MAX) {
    return echec('REQUETE_INVALIDE');
  }

  const rdv = await db.getRow<RendezVous>(TABLES.rendezVous, corps.rendezVousId);
  if (!rdv) return echec('INTROUVABLE');
  if (acteur.role !== 'client' || rdv.clientId !== acteur.id) return echec('NON_AUTORISE');
  if (rdv.statut !== 'TERMINE') return echec('TRANSITION_INVALIDE');
  if (rdv.aAvis) return echec('DEJA_EVALUE');

  // The unique index on rendezVousId turns a double tap into one review.
  const avisId = db.nouvelId();
  try {
    await db.createRow<Avis>(TABLES.avis, avisId, {
      rendezVousId: rdv.$id,
      fournisseurId: rdv.fournisseurId,
      clientId: acteur.id,
      clientNom: rdv.clientNom,
      serviceTitre: rdv.serviceTitre,
      note: corps.note,
      criteres: corps.criteres,
      commentaire: corps.commentaire,
    });
  } catch (e) {
    if (!estConflit(e)) throw e;
    // The review exists, so an earlier call stopped before marking the booking. Only the call that wrote it counts the rating.
    await db.updateRow<RendezVous>(TABLES.rendezVous, rdv.$id, { aAvis: true });
    return echec('DEJA_EVALUE');
  }

  await db.updateRow<RendezVous>(TABLES.rendezVous, rdv.$id, { aAvis: true });
  const fournisseur = await db.getRow<Fournisseur>(TABLES.fournisseurs, rdv.fournisseurId);
  if (fournisseur) {
    const { moyenne, nb } = moyenneApresAvis(
      fournisseur.noteMoyenne,
      fournisseur.nbAvis,
      corps.note,
    );
    await db.updateRow<Fournisseur>(TABLES.fournisseurs, fournisseur.$id, {
      noteMoyenne: moyenne,
      nbAvis: nb,
    });
  }
  return succes({ avisId });
}
