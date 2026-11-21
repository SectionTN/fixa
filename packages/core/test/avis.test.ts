import { describe, expect, it } from 'vitest';
import {
  CRITERES_AVIS,
  LONGUEUR_MAX,
  libelleNote,
  MESSAGES_ERREUR,
  moyenneApresAvis,
} from '../src';

it('adds one rating to a running average', () => {
  const m = moyenneApresAvis(4.9, 128, 4);
  expect(m.nb).toBe(129);
  expect(m.moyenne).toBeCloseTo(4.893, 3);
  expect(moyenneApresAvis(0, 0, 5)).toEqual({ moyenne: 5, nb: 1 });
});

it('ships the five review criteria and every error message in French', () => {
  expect(CRITERES_AVIS).toEqual([
    'Ponctualité',
    'Accueil',
    'Travail soigné',
    'Bon rapport qualité-prix',
    'Propreté',
  ]);
  expect(MESSAGES_ERREUR.CRENEAU_PRIS).toBe(
    "Ce créneau vient d'être pris. Choisissez-en un autre.",
  );
  expect(MESSAGES_ERREUR.TRANSITION_INVALIDE).toBe('Ce rendez-vous a changé. Actualisez la liste.');
  expect(Object.values(MESSAGES_ERREUR).every((m) => m.length > 0)).toBe(true);
});

describe('libelleNote', () => {
  it('names each rating, with a hint before the first tap', () => {
    expect(libelleNote(4)).toBe('Très bien');
    expect(libelleNote(5)).toBe('Excellent');
    expect([1, 2, 3].map(libelleNote)).toEqual(['Décevant', 'Moyen', 'Bien']);
    expect(libelleNote(0)).toBe('Touchez une étoile pour noter');
  });

  it('caps the comment at 500 characters', () => {
    expect(LONGUEUR_MAX.commentaire).toBe(500);
  });
});
