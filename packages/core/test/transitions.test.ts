import { expect, it } from 'vitest';
import { appliquerAction } from '../src';

const rdv = {
  statut: 'EN_ATTENTE',
  debut: '2026-10-26T07:30:00.000Z',
  dateLimiteReponse: '2026-10-25T10:15:00.000Z',
  clientId: 'u-yasmine',
  fournisseurId: 'u-karim',
} as const;
const karim = { id: 'u-karim', role: 'fournisseur' } as const;
const sami = { id: 'u-sami', role: 'fournisseur' } as const;
const yasmine = { id: 'u-yasmine', role: 'client' } as const;
const worker = { id: 'worker', role: 'systeme' } as const;
const salma = { id: 'u-salma', role: 'admin' } as const;

it('lets the provider accept before the deadline only', () => {
  expect(appliquerAction(rdv, 'accepter', karim, new Date('2026-10-25T09:00:00Z'))).toEqual({
    ok: true,
    statut: 'CONFIRME',
    annulationTardive: false,
  });
  expect(appliquerAction(rdv, 'accepter', karim, new Date('2026-10-25T10:16:00Z'))).toEqual({
    ok: false,
    code: 'DELAI_DEPASSE',
  });
});

it('rejects the wrong person before looking at the state', () => {
  expect(appliquerAction(rdv, 'accepter', sami, new Date('2026-10-25T09:00:00Z'))).toEqual({
    ok: false,
    code: 'NON_AUTORISE',
  });
  expect(appliquerAction(rdv, 'accepter', yasmine, new Date('2026-10-25T09:00:00Z'))).toEqual({
    ok: false,
    code: 'NON_AUTORISE',
  });
  expect(appliquerAction(rdv, 'annuler', salma, new Date('2026-10-25T09:00:00Z'))).toEqual({
    ok: false,
    code: 'NON_AUTORISE',
  });
  expect(appliquerAction(rdv, 'expirer', karim, new Date('2026-10-25T10:16:00Z'))).toEqual({
    ok: false,
    code: 'NON_AUTORISE',
  });
});

it('rejects an action from the wrong state', () => {
  expect(
    appliquerAction(
      { ...rdv, statut: 'ANNULE' },
      'accepter',
      karim,
      new Date('2026-10-25T09:00:00Z'),
    ),
  ).toEqual({ ok: false, code: 'TRANSITION_INVALIDE' });
  expect(
    appliquerAction(
      { ...rdv, statut: 'TERMINE' },
      'annuler',
      yasmine,
      new Date('2026-10-25T09:00:00Z'),
    ),
  ).toEqual({ ok: false, code: 'TRANSITION_INVALIDE' });
});

it('lets the provider refuse a pending request', () => {
  expect(appliquerAction(rdv, 'refuser', karim, new Date('2026-10-25T11:00:00Z'))).toEqual({
    ok: true,
    statut: 'REFUSE',
    annulationTardive: false,
  });
});

it('counts a late cancellation for the client only', () => {
  const confirme = { ...rdv, statut: 'CONFIRME' } as const;
  expect(appliquerAction(confirme, 'annuler', yasmine, new Date('2026-10-26T06:30:00Z'))).toEqual({
    ok: true,
    statut: 'ANNULE',
    annulationTardive: true,
  });
  expect(appliquerAction(confirme, 'annuler', yasmine, new Date('2026-10-26T04:00:00Z'))).toEqual({
    ok: true,
    statut: 'ANNULE',
    annulationTardive: false,
  });
  expect(appliquerAction(confirme, 'annuler', karim, new Date('2026-10-26T06:30:00Z'))).toEqual({
    ok: true,
    statut: 'ANNULE',
    annulationTardive: false,
  });
  expect(appliquerAction(confirme, 'annuler', yasmine, new Date('2026-10-26T07:30:00Z'))).toEqual({
    ok: false,
    code: 'TRANSITION_INVALIDE',
  });
});

it('completes only once the appointment has started', () => {
  const confirme = { ...rdv, statut: 'CONFIRME' } as const;
  expect(appliquerAction(confirme, 'terminer', karim, new Date('2026-10-26T07:00:00Z'))).toEqual({
    ok: false,
    code: 'TROP_TOT',
  });
  expect(appliquerAction(confirme, 'terminer', karim, new Date('2026-10-26T07:40:00Z'))).toEqual({
    ok: true,
    statut: 'TERMINE',
    annulationTardive: false,
  });
  expect(appliquerAction(confirme, 'terminer', worker, new Date('2026-10-26T10:00:00Z'))).toEqual({
    ok: true,
    statut: 'TERMINE',
    annulationTardive: false,
  });
});

it('lets the worker expire a request past its deadline only', () => {
  expect(appliquerAction(rdv, 'expirer', worker, new Date('2026-10-25T10:16:00Z'))).toEqual({
    ok: true,
    statut: 'EXPIRE',
    annulationTardive: false,
  });
  expect(appliquerAction(rdv, 'expirer', worker, new Date('2026-10-25T10:00:00Z'))).toEqual({
    ok: false,
    code: 'TRANSITION_INVALIDE',
  });
});
