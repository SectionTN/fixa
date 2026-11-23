import type { Role } from './domaine';
import { MESSAGES_ERREUR } from './erreurs';
import { textes } from './i18n/textes';
import { LABELS } from './ids';

export const LONGUEUR_MIN_MOT_DE_PASSE = 8;
const LONGUEUR_LONGUE = 12;

// Labels are set only by the api function, admin outranks the others.
export function roleDe(labels: readonly string[]): Role | null {
  if (labels.includes(LABELS.admin)) return 'admin';
  if (labels.includes(LABELS.fournisseur)) return 'fournisseur';
  if (labels.includes(LABELS.client)) return 'client';
  return null;
}

export function separerNom(complet: string): { prenom: string; nom: string } {
  const [prenom = '', ...reste] = complet.trim().split(/\s+/).filter(Boolean);
  return { prenom, nom: reste.join(' ') };
}

// 0 empty, then 1 to 4 for the four labels of textes.auth.inscription.force.
export function forceMotDePasse(mdp: string): 0 | 1 | 2 | 3 | 4 {
  if (!mdp) return 0;
  if (mdp.length < LONGUEUR_MIN_MOT_DE_PASSE) return 1;
  const points =
    1 +
    Number(/\d/.test(mdp)) +
    Number(/[a-z]/.test(mdp) && /[A-Z]/.test(mdp)) +
    Number(/[^A-Za-z0-9]/.test(mdp) || mdp.length >= LONGUEUR_LONGUE);
  return Math.min(points, 4) as 1 | 2 | 3 | 4;
}

const IDENTIFIANTS = ['user_invalid_credentials', 'user_password_mismatch'];
const COMPTE_EXISTE = ['user_already_exists', 'user_email_already_exists'];

// Google on iOS signs a nonce of its own into the ID token, and Appwrite wants it back verbatim.
export function nonceDuJeton(idToken: string): string | undefined {
  const charge = idToken.split('.')[1];
  if (!charge) return undefined;
  try {
    const base64 = charge.replace(/-/g, '+').replace(/_/g, '/');
    const claims: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    const nonce = (claims as { nonce?: unknown } | null)?.nonce;
    return typeof nonce === 'string' && nonce !== '' ? nonce : undefined;
  } catch {
    return undefined;
  }
}

// An Appwrite error without a type never reached the server.
export function messageAuth(type: string | undefined): string {
  if (!type) return textes.auth.erreurs.reseau;
  if (IDENTIFIANTS.includes(type)) return textes.auth.erreurs.identifiants;
  if (COMPTE_EXISTE.includes(type)) return textes.auth.erreurs.compteExiste;
  return MESSAGES_ERREUR.REQUETE_INVALIDE;
}
