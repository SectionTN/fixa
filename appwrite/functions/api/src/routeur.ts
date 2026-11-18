import { type Acteur, type CodeErreur, LONGUEUR_MAX, type ReponseApi, roleDe } from '@fixa/core';
import type { Db } from '@fixa/fn-commun';
import { echec } from './reponse';
import { deciderFournisseur } from './routes/admin';
import { publierAvis } from './routes/avis';
import { changerStatut, reserver } from './routes/rendezVous';
import { choisirRole } from './routes/role';

// The caller as Appwrite's account service reports it, never as the request claims it.
export type Appelant = { id: string; labels: string[] } | null;
export type Resultat = { statut: number; corps: ReponseApi<unknown> };

const STATUT_HTTP: Record<CodeErreur, number> = {
  NON_AUTORISE: 403,
  INTROUVABLE: 404,
  REQUETE_INVALIDE: 400,
  TRANSITION_INVALIDE: 409,
  DELAI_DEPASSE: 409,
  TROP_TOT: 409,
  CRENEAU_PRIS: 409,
  FOURNISSEUR_INDISPONIBLE: 409,
  DEJA_EVALUE: 409,
};

const ROUTE_STATUT = /^\/rendez-vous\/([^/]+)\/(accepter|refuser|annuler|terminer)$/;
const ROUTE_ADMIN = /^\/admin\/fournisseurs\/([^/]+)\/(valider|refuser)$/;

const repondre = (corps: ReponseApi<unknown>, statut?: number): Resultat => ({
  statut: statut ?? (corps.ok ? 200 : STATUT_HTTP[corps.code]),
  corps,
});

const tropLong = (cle: string, valeur: string) =>
  cle in LONGUEUR_MAX && valeur.length > LONGUEUR_MAX[cle as keyof typeof LONGUEUR_MAX];

function textes<K extends string>(corps: Record<string, unknown>, cles: readonly K[]) {
  const sortie = {} as Record<K, string>;
  for (const cle of cles) {
    const valeur = corps[cle];
    if (typeof valeur !== 'string' || tropLong(cle, valeur)) return null;
    sortie[cle] = valeur;
  }
  return sortie;
}

// undefined when the body has no motif, null when it has one the columns cannot hold.
function motifDe(corps: Record<string, unknown>): string | undefined | null {
  if (corps.motif === undefined) return undefined;
  return typeof corps.motif === 'string' && !tropLong('motif', corps.motif) ? corps.motif : null;
}

export async function router(
  db: Db,
  appelant: Appelant,
  methode: string,
  chemin: string,
  corpsBrut: unknown,
  maintenant: Date,
): Promise<Resultat> {
  if (!appelant) return repondre(echec('NON_AUTORISE'), 401);
  const introuvable = repondre(echec('REQUETE_INVALIDE'), 404);
  if (methode !== 'POST') return introuvable;
  const corps =
    typeof corpsBrut === 'object' && corpsBrut !== null
      ? (corpsBrut as Record<string, unknown>)
      : {};

  if (chemin === '/role') {
    const champs = textes(corps, ['prenom', 'nom', 'telephone', 'ville'] as const);
    const type = corps.type;
    if (!champs || (type !== 'client' && type !== 'fournisseur')) {
      return repondre(echec('REQUETE_INVALIDE'));
    }
    return repondre(await choisirRole(db, appelant.id, { type, ...champs }));
  }

  const role = roleDe(appelant.labels);
  const acteur: Acteur | null = role ? { id: appelant.id, role } : null;
  const statut = ROUTE_STATUT.exec(chemin);
  const admin = ROUTE_ADMIN.exec(chemin);
  const connue = chemin === '/rendez-vous' || chemin === '/avis' || statut || admin;
  if (!connue) return introuvable;
  if (!acteur) return repondre(echec('NON_AUTORISE'));

  if (chemin === '/rendez-vous') {
    const champs = textes(corps, [
      'fournisseurId',
      'serviceId',
      'debut',
      'adresse',
      'description',
    ] as const);
    if (!champs) return repondre(echec('REQUETE_INVALIDE'));
    return repondre(await reserver(db, acteur, champs, maintenant));
  }

  if (chemin === '/avis') {
    const { rendezVousId, note, criteres, commentaire = '' } = corps;
    const valide =
      typeof rendezVousId === 'string' &&
      typeof note === 'number' &&
      Array.isArray(criteres) &&
      criteres.every((c) => typeof c === 'string') &&
      typeof commentaire === 'string';
    if (!valide) return repondre(echec('REQUETE_INVALIDE'));
    return repondre(
      await publierAvis(db, acteur, {
        rendezVousId,
        note: note as 1 | 2 | 3 | 4 | 5,
        criteres: criteres as string[],
        commentaire,
      }),
    );
  }

  const motif = motifDe(corps);
  if (motif === null) return repondre(echec('REQUETE_INVALIDE'));

  if (statut) {
    const [, id = '', action] = statut;
    return repondre(
      await changerStatut(
        db,
        acteur,
        id,
        action as 'accepter' | 'refuser' | 'annuler' | 'terminer',
        { motif },
        maintenant,
      ),
    );
  }

  const [, id = '', decision] = admin ?? [];
  return repondre(
    await deciderFournisseur(db, acteur, id, decision as 'valider' | 'refuser', motif, maintenant),
  );
}
