import { fr } from './i18n/fr';

export type CodeErreur =
  | 'NON_AUTORISE'
  | 'TRANSITION_INVALIDE'
  | 'DELAI_DEPASSE'
  | 'TROP_TOT'
  | 'CRENEAU_PRIS'
  | 'FOURNISSEUR_INDISPONIBLE'
  | 'DEJA_EVALUE'
  | 'INTROUVABLE'
  | 'REQUETE_INVALIDE'
  | 'SESSION_EXPIREE'
  | 'RESEAU';

export const MESSAGES_ERREUR: Record<CodeErreur, string> = fr.erreurs;

export type ReponseApi<T> =
  | { ok: true; data: T }
  | { ok: false; code: CodeErreur; message: string };
