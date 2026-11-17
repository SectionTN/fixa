import { expect, it } from 'vitest';
import { distanceKm, trierFournisseurs } from '../src';

it('measures the distance between La Marsa and Le Kram', () => {
  expect(distanceKm({ lat: 36.8782, lng: 10.3247 }, { lat: 36.8333, lng: 10.3167 })).toBeCloseTo(
    5,
    0,
  );
});

it('ranks by soonest slot, then distance, rating and price', () => {
  const f = (
    nom: string,
    prochainCreneau: string | null,
    distanceKm: number | null,
    noteMoyenne: number,
    prixMin: number | null,
  ) => ({ nom, prochainCreneau, distanceKm, noteMoyenne, prixMin });
  const liste = [
    f('sans creneau', null, 0.5, 5, 10),
    f('loin', '2026-10-26T07:00:00.000Z', 9, 5, 10),
    f('demain', '2026-10-27T07:00:00.000Z', 1, 5, 10),
    f('sans distance', '2026-10-26T07:00:00.000Z', null, 5, 10),
    f('proche moins bien note', '2026-10-26T07:00:00.000Z', 1.2, 4.6, 10),
    f('proche cher', '2026-10-26T07:00:00.000Z', 1.2, 4.9, 60),
    f('proche', '2026-10-26T07:00:00.000Z', 1.2, 4.9, 40),
  ];
  const copie = [...liste];
  expect(trierFournisseurs(liste).map((x) => x.nom)).toEqual([
    'proche',
    'proche cher',
    'proche moins bien note',
    'loin',
    'sans distance',
    'demain',
    'sans creneau',
  ]);
  expect(liste).toEqual(copie);
});
