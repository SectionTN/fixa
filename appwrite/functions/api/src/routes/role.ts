import {
  type Fournisseur,
  LABELS,
  type Profil,
  type ReponseApi,
  type Role,
  TABLES,
} from '@fixa/core';
import { type Db, estConflit } from '@fixa/fn-commun';
import { echec, lire, modifier, succes } from '../reponse';

export type CorpsRole = {
  type: 'client' | 'fournisseur';
  prenom: string;
  nom: string;
  telephone: string;
  ville: string;
};

const ROLES_POSES: readonly string[] = [LABELS.admin, LABELS.client, LABELS.fournisseur];

async function creerSiAbsent(creation: () => Promise<unknown>) {
  try {
    await creation();
  } catch (e) {
    if (!estConflit(e)) throw e;
  }
}

export async function choisirRole(
  db: Db,
  appelantId: string,
  corps: CorpsRole,
): Promise<ReponseApi<{ role: Role }>> {
  const utilisateur = await db.getUser(appelantId);
  if (!utilisateur) return echec('INTROUVABLE');
  const dejaPose = utilisateur.labels.find((l) => ROLES_POSES.includes(l));
  if (dejaPose === corps.type) return succes({ role: corps.type });
  if (dejaPose) return echec('TRANSITION_INVALIDE');

  const estFournisseur = corps.type === 'fournisseur';
  // Rows first, label last, so a retry after a failure finds no half-made account.
  await creerSiAbsent(() =>
    db.createRow<Profil>(
      TABLES.profils,
      appelantId,
      {
        prenom: corps.prenom,
        nom: corps.nom,
        telephone: corps.telephone,
        langue: 'fr',
        ville: corps.ville,
        specialites: [],
        description: '',
        adresse: '',
        latitude: null,
        longitude: null,
      },
      [lire(appelantId), modifier(appelantId), ...(estFournisseur ? ['read("any")'] : [])],
    ),
  );
  if (estFournisseur) {
    await creerSiAbsent(() =>
      db.createRow<Fournisseur>(TABLES.fournisseurs, appelantId, {
        nom: `${corps.prenom} ${corps.nom}`,
        categorieId: '',
        ville: corps.ville,
        latitude: 0,
        longitude: 0,
        prixMin: null,
        statutVerification: 'EN_ATTENTE',
        noteMoyenne: 0,
        nbAvis: 0,
        visible: false,
        finEssai: null,
        finAbonnement: null,
        motifRefus: null,
      }),
    );
  }
  await db.updateLabels(appelantId, [...utilisateur.labels, corps.type]);
  return succes({ role: corps.type });
}
