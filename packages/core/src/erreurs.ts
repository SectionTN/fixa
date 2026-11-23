import { fr } from './i18n/fr';
import { textes } from './i18n/textes';

export type CodeErreur =
  | 'NON_AUTORISE'
  | 'TRANSITION_INVALIDE'
  | 'DELAI_DEPASSE'
  | 'TROP_TOT'
  | 'CRENEAU_PRIS'
  | 'FOURNISSEUR_INDISPONIBLE'
  | 'DEJA_EVALUE'
  | 'DOSSIER_TRAITE'
  | 'INTROUVABLE'
  | 'REQUETE_INVALIDE'
  | 'ADRESSE_REQUISE'
  | 'SESSION_EXPIREE'
  | 'RESEAU';

// Getters, so each message is read in the current language.
export const MESSAGES_ERREUR = Object.defineProperties(
  {} as Record<CodeErreur, string>,
  Object.fromEntries(
    (Object.keys(fr.erreurs) as CodeErreur[]).map((code) => [
      code,
      { enumerable: true, get: () => textes.erreurs[code] },
    ]),
  ),
);

export type ReponseApi<T> =
  | { ok: true; data: T }
  | { ok: false; code: CodeErreur; message: string };
