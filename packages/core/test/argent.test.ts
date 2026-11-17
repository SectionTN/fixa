import { expect, it } from 'vitest';
import { formatNote, formatPrix, formatPrixService } from '../src';

it('formats prices in dinars', () => {
  expect(formatPrix(40)).toBe('40 DT');
  expect(formatPrix(40, 'en')).toBe('40 DT');
  expect(formatPrix(40, 'ar')).toBe('40 د.ت');
  expect(formatPrix(37.5)).toBe('37,5 DT');
});

it('formats a service price by its type', () => {
  expect(formatPrixService({ typePrix: 'FIXE', prix: 60 })).toBe('60 DT');
  expect(formatPrixService({ typePrix: 'A_PARTIR_DE', prix: 45 })).toBe('dès 45 DT');
  expect(formatPrixService({ typePrix: 'SUR_DEVIS', prix: null })).toBe('Sur devis');
});

it('formats ratings with a decimal comma', () => {
  expect(formatNote(4.9)).toBe('4,9');
  expect(formatNote(5)).toBe('5,0');
  expect(formatNote(4.893)).toBe('4,9');
});
