import type { Langue, TypePrix } from './domaine';
import { fr } from './i18n/fr';

const DEVISE: Record<Langue, string> = { fr: 'DT', en: 'DT', ar: 'د.ت' };

function nombre(valeur: number): string {
  const texte = Number.isInteger(valeur) ? String(valeur) : String(Number(valeur.toFixed(2)));
  return texte.replace('.', ',');
}

export function formatPrix(montant: number, langue: Langue = 'fr'): string {
  return `${nombre(montant)} ${DEVISE[langue]}`;
}

export function formatPrixService(s: { typePrix: TypePrix; prix: number | null }): string {
  if (s.typePrix === 'SUR_DEVIS' || s.prix === null) return fr.prix.surDevis;
  if (s.typePrix === 'A_PARTIR_DE') return `${fr.prix.aPartirDe} ${formatPrix(s.prix)}`;
  return formatPrix(s.prix);
}

export function formatNote(note: number): string {
  return note.toFixed(1).replace('.', ',');
}
