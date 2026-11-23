import { describe, expect, it } from 'vitest';
import { choisirLangue, textes } from '../src/i18n/textes';
import { jourLocal } from '../src/temps';

describe('textes', () => {
  it('suit la langue choisie, meme par une section lue avant le changement', () => {
    const onglets = textes.onglets;
    choisirLangue('en');
    expect(onglets.accueil).toBe('Home');
    expect(textes.auth.inscription.motDePasse).toBe('Password');
    choisirLangue('ar');
    expect(onglets.accueil).toBe('الرئيسية');
    choisirLangue('fr');
    expect(onglets.accueil).toBe('Accueil');
  });

  it('liste les cles de la langue courante', () => {
    choisirLangue('en');
    expect(Object.keys(textes.recherche.metiers)).toContain('plomberie');
    expect(textes.recherche.metiers.plomberie).toBe('a plumber');
    choisirLangue('fr');
  });
});

describe('jourLocal', () => {
  it('ecrit le jour dans la langue courante', () => {
    choisirLangue('en');
    expect(jourLocal('2026-11-24T09:00:00.000Z')).toBe('Tuesday 24 November');
    choisirLangue('fr');
    expect(jourLocal('2026-11-24T09:00:00.000Z')).toBe('mardi 24 novembre');
  });
});
