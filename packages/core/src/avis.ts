import { fr } from './i18n/fr';
import { textes } from './i18n/textes';

export const CRITERES_AVIS: readonly string[] = fr.avis.criteres;

export function moyenneApresAvis(
  moyenne: number,
  nb: number,
  note: number,
): { moyenne: number; nb: number } {
  const total = nb + 1;
  return { moyenne: (moyenne * nb + note) / total, nb: total };
}

// The word under the stars, or the hint before the client picks a rating.
export function libelleNote(note: number): string {
  return textes.avis.notes[note - 1] ?? textes.avis.toucherEtoile;
}
