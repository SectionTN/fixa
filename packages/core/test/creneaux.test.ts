import { expect, it } from 'vitest';
import { cellules, creneauxLibres, type Disponibilite, prochainCreneau } from '../src';

const dispos: Disponibilite[] = [
  { fournisseurId: 'u-karim', jour: 1, debut: '08:00', fin: '12:00' },
  { fournisseurId: 'u-karim', jour: 1, debut: '14:00', fin: '18:00' },
];
const base = {
  jour: '2026-10-26',
  dureeMin: 45,
  disponibilites: dispos,
  conges: [],
  joursFeries: [],
  maintenant: new Date('2026-10-25T09:00:00Z'),
};

it('splits a booking into 30 min cells', () => {
  expect(cellules('2026-10-26T07:00:00.000Z', 45)).toEqual([
    '2026-10-26T07:00:00.000Z',
    '2026-10-26T07:30:00.000Z',
  ]);
  expect(cellules('2026-10-26T07:00:00.000Z', 120)).toHaveLength(4);
});

it('lists free starts inside the weekly ranges', () => {
  const r = creneauxLibres({ ...base, occupees: ['2026-10-26T08:00:00.000Z'] }); // 09:00 Tunis pris
  expect(r.slice(0, 5)).toEqual([
    '2026-10-26T07:00:00.000Z',
    '2026-10-26T08:30:00.000Z',
    '2026-10-26T09:00:00.000Z',
    '2026-10-26T09:30:00.000Z',
    '2026-10-26T10:00:00.000Z',
  ]);
  expect(r).toHaveLength(12);
  expect(r.at(-1)).toBe('2026-10-26T16:00:00.000Z'); // 17:00 Tunis, ends 17:45
});

it('returns nothing on leave, a public holiday or a closed weekday', () => {
  const conge = { fournisseurId: 'u-karim', debut: '2026-10-26', fin: '2026-10-30' };
  expect(creneauxLibres({ ...base, occupees: [], conges: [conge] })).toEqual([]);
  expect(creneauxLibres({ ...base, occupees: [], joursFeries: ['2026-10-26'] })).toEqual([]);
  expect(creneauxLibres({ ...base, jour: '2026-10-27', occupees: [] })).toEqual([]);
});

it('drops starts less than 90 min from now', () => {
  const r = creneauxLibres({ ...base, occupees: [], maintenant: new Date('2026-10-26T06:00:00Z') });
  expect(r[0]).toBe('2026-10-26T07:30:00.000Z'); // 07:00 Tunis + 90 min
});

it('finds the next free start across days', () => {
  const p = { ...base, occupees: [], maintenant: new Date('2026-10-26T16:00:00Z') };
  expect(prochainCreneau({ ...p, joursMax: 14 })).toBe('2026-11-02T07:00:00.000Z');
  expect(prochainCreneau({ ...p, joursMax: 3 })).toBeNull();
});
