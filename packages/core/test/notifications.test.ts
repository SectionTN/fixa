import { describe, expect, it } from 'vitest';
import type { RendezVousLu } from '../src/donnees';
import { estNonLue, notificationsClient, sectionnerNotifications } from '../src/notifications';

// Lundi 23 novembre 2026, 13:00 a Tunis.
const maintenant = new Date('2026-11-23T12:00:00.000Z');

const rdv = (id: string, extra: Partial<RendezVousLu> & { $updatedAt?: string }): RendezVousLu => ({
  $id: id,
  $createdAt: '2026-11-23T09:00:00.000Z',
  clientId: 'yasmine',
  fournisseurId: 'karim',
  serviceId: 's1',
  serviceTitre: 'Réparation de fuite',
  typePrix: 'FIXE',
  prix: 40,
  duree: 60,
  debut: '2026-11-24T08:00:00.000Z',
  adresse: '',
  description: '',
  estUrgent: false,
  source: 'APP',
  statut: 'EN_ATTENTE',
  dateLimiteReponse: '2026-11-24T06:00:00.000Z',
  motif: null,
  annulePar: null,
  annulationTardive: false,
  clientNom: 'Yasmine Trabelsi',
  clientTelephone: '',
  fournisseurNom: 'Karim Ben Salah',
  aAvis: false,
  dernierStatutNotifie: null,
  ...extra,
});

describe('notificationsClient', () => {
  it('raconte chaque reponse du pro, la plus recente en premier', () => {
    const liste = notificationsClient([
      rdv('a', { statut: 'EN_ATTENTE', $createdAt: '2026-11-23T09:00:00.000Z' }),
      rdv('b', { statut: 'CONFIRME', $updatedAt: '2026-11-23T11:55:00.000Z' }),
      rdv('c', { statut: 'REFUSE', $updatedAt: '2026-11-20T10:00:00.000Z' }),
    ]);
    expect(liste.map((n) => [n.rdv.$id, n.genre])).toEqual([
      ['b', 'confirme'],
      ['a', 'envoye'],
      ['c', 'refuse'],
    ]);
  });

  it("ne dit rien d'une annulation du client ni d'un avis deja laisse", () => {
    const liste = notificationsClient([
      rdv('a', { statut: 'ANNULE', annulePar: 'client' }),
      rdv('b', { statut: 'ANNULE', annulePar: 'fournisseur' }),
      rdv('c', { statut: 'TERMINE', aAvis: true }),
      rdv('d', { statut: 'TERMINE', aAvis: false }),
    ]);
    expect(liste.map((n) => [n.rdv.$id, n.genre]).sort()).toEqual([
      ['b', 'annule'],
      ['d', 'avis'],
    ]);
  });
});

describe('sectionnerNotifications', () => {
  it("range par jour de Tunis : aujourd'hui, la semaine, puis plus tot", () => {
    const liste = notificationsClient([
      rdv('a', { statut: 'CONFIRME', $updatedAt: '2026-11-23T08:00:00.000Z' }),
      rdv('b', { statut: 'REFUSE', $updatedAt: '2026-11-20T08:00:00.000Z' }),
      rdv('c', { statut: 'EXPIRE', dateLimiteReponse: '2026-11-01T08:00:00.000Z' }),
    ]);
    const sections = sectionnerNotifications(liste, maintenant);
    expect(sections.map((s) => [s.cle, s.notifications.map((n) => n.rdv.$id)])).toEqual([
      ['aujourdhui', ['a']],
      ['semaine', ['b']],
      ['plusTot', ['c']],
    ]);
  });
});

describe('estNonLue', () => {
  it('compare au dernier tout lire, quel que soit le format de la date', () => {
    const [n] = notificationsClient([
      rdv('a', { statut: 'CONFIRME', $updatedAt: '2026-11-23T11:00:00.000+00:00' }),
    ]);
    if (!n) throw new Error('notification attendue');
    expect(estNonLue(n, null)).toBe(true);
    expect(estNonLue(n, '2026-11-23T10:00:00.000Z')).toBe(true);
    expect(estNonLue(n, '2026-11-23T11:30:00.000Z')).toBe(false);
  });
});

describe('moment de chaque notification', () => {
  it('date une demande expiree a sa limite et un avis a la fin du rendez-vous', () => {
    const liste = notificationsClient([
      rdv('a', { statut: 'EXPIRE', dateLimiteReponse: '2026-11-22T06:00:00.000Z' }),
      rdv('b', { statut: 'TERMINE', debut: '2026-11-19T09:00:00.000Z', duree: 90 }),
    ]);
    expect(liste.map((n) => [n.rdv.$id, n.quand])).toEqual([
      ['a', '2026-11-22T06:00:00.000Z'],
      ['b', '2026-11-19T10:30:00.000Z'],
    ]);
  });
});
