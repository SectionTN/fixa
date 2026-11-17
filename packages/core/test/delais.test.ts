import { expect, it } from 'vitest';
import { dateLimiteReponse, doitExpirer, doitTerminerAuto, estAnnulationTardive } from '../src';

it('gives the provider 2 h, never later than 1 h before the appointment', () => {
  expect(
    dateLimiteReponse(
      new Date('2026-10-25T08:15:00Z'),
      new Date('2026-10-26T07:30:00Z'),
    ).toISOString(),
  ).toBe('2026-10-25T10:15:00.000Z'); // recue 09:15, avant 11:15
  expect(
    dateLimiteReponse(
      new Date('2026-10-25T08:00:00Z'),
      new Date('2026-10-25T10:00:00Z'),
    ).toISOString(),
  ).toBe('2026-10-25T09:00:00.000Z');
});

it('marks a client cancellation late under 2 h before the start', () => {
  const debut = new Date('2026-10-26T07:30:00Z');
  expect(estAnnulationTardive(debut, new Date('2026-10-26T06:30:00Z'))).toBe(true);
  expect(estAnnulationTardive(debut, new Date('2026-10-26T05:30:00Z'))).toBe(false);
  expect(estAnnulationTardive(debut, new Date('2026-10-26T04:30:00Z'))).toBe(false);
});

it('expires a pending request only after its deadline', () => {
  const rdv = { statut: 'EN_ATTENTE', dateLimiteReponse: '2026-10-25T10:15:00.000Z' } as const;
  expect(doitExpirer(rdv, new Date('2026-10-25T10:15:00Z'))).toBe(false);
  expect(doitExpirer(rdv, new Date('2026-10-25T10:16:00Z'))).toBe(true);
  expect(doitExpirer({ ...rdv, statut: 'CONFIRME' }, new Date('2026-10-25T11:00:00Z'))).toBe(false);
});

it('completes a confirmed appointment 2 h after its end', () => {
  const rdv = { statut: 'CONFIRME', debut: '2026-10-26T07:30:00.000Z', duree: 45 } as const;
  expect(doitTerminerAuto(rdv, new Date('2026-10-26T10:14:00Z'))).toBe(false);
  expect(doitTerminerAuto(rdv, new Date('2026-10-26T10:15:00Z'))).toBe(true);
  expect(doitTerminerAuto({ ...rdv, statut: 'EN_ATTENTE' }, new Date('2026-10-27T00:00:00Z'))).toBe(
    false,
  );
});
