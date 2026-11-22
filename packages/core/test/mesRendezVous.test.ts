import { describe, expect, it } from 'vitest';
import type { RendezVous } from '../src/domaine';
import {
  abonnerRendezVous,
  actionsRendezVous,
  classerMesRendezVous,
  infoRendezVous,
  statutAffiche,
} from '../src/mesRendezVous';

// Samedi 21 novembre 2026, 10:00 a Tunis.
const maintenant = new Date('2026-11-21T09:00:00.000Z');
const jours = (n: number, heure = '07:30') => {
  const d = new Date(maintenant);
  d.setUTCDate(d.getUTCDate() + n);
  return `${d.toISOString().slice(0, 10)}T${heure}:00.000Z`;
};

const rdv = (id: string, extra: Partial<RendezVous>): RendezVous & { $createdAt: string } => ({
  $id: id,
  $createdAt: '2026-11-01T00:00:00.000Z',
  clientId: 'yasmine',
  fournisseurId: 'karim',
  serviceId: 's1',
  serviceTitre: 'Réparation de fuite',
  typePrix: 'FIXE',
  prix: 40,
  duree: 60,
  debut: jours(1),
  adresse: '',
  description: '',
  estUrgent: false,
  source: 'APP',
  statut: 'CONFIRME',
  dateLimiteReponse: jours(1, '05:00'),
  motif: null,
  annulePar: null,
  annulationTardive: false,
  clientNom: 'Yasmine Trabelsi',
  clientTelephone: '',
  fournisseurNom: 'Garage Mansour',
  aAvis: false,
  dernierStatutNotifie: null,
  ...extra,
});

const ids = (liste: { $id: string }[]) => liste.map((r) => r.$id);

describe('classerMesRendezVous', () => {
  it('garde a venir les demandes et RDV confirmes pas encore finis, le plus proche d abord', () => {
    const { aVenir, passes } = classerMesRendezVous(
      [
        rdv('confirme', { debut: jours(2) }),
        rdv('attente', { statut: 'EN_ATTENTE', debut: jours(1) }),
        rdv('en-cours', {
          debut: new Date(maintenant.getTime() - 60 * 60_000).toISOString(),
          duree: 180,
        }),
        rdv('fini-pas-clos', { debut: jours(-1), duree: 60 }),
        rdv('termine', { statut: 'TERMINE', debut: jours(-3) }),
      ],
      maintenant,
    );
    expect(aVenir.flatMap((s) => ids(s.rendezVous))).toEqual(['en-cours', 'attente', 'confirme']);
    expect(passes.flatMap((s) => ids(s.rendezVous))).toEqual(['fini-pas-clos', 'termine']);
  });

  it('groupe les sept prochains jours sous Cette semaine, puis par mois', () => {
    const { aVenir } = classerMesRendezVous(
      [
        rdv('j1', { debut: jours(1) }),
        rdv('j6', { debut: jours(6) }),
        rdv('j8', { debut: jours(8) }),
        rdv('j12', { debut: jours(12) }),
        rdv('j45', { debut: jours(45) }),
      ],
      maintenant,
    );
    expect(aVenir.map((s) => [s.titre, ids(s.rendezVous)])).toEqual([
      ['Cette semaine', ['j1', 'j6']],
      ['Novembre', ['j8']],
      ['Décembre', ['j12']],
      ['Janvier 2027', ['j45']],
    ]);
  });

  it('range le reste en passes, le plus recent d abord, par mois avec l annee quand elle change', () => {
    const { aVenir, passes } = classerMesRendezVous(
      [
        rdv('refuse', { statut: 'REFUSE', debut: jours(-30) }),
        rdv('annule-futur', { statut: 'ANNULE', debut: jours(5) }),
        rdv('expire', { statut: 'EXPIRE', debut: '2025-12-10T08:00:00.000Z' }),
        rdv('termine', { statut: 'TERMINE', debut: jours(-3) }),
      ],
      maintenant,
    );
    expect(aVenir).toEqual([]);
    expect(passes.map((s) => [s.titre, ids(s.rendezVous)])).toEqual([
      ['Novembre', ['annule-futur', 'termine']],
      ['Octobre', ['refuse']],
      ['Décembre 2025', ['expire']],
    ]);
  });

  it('lit les mois en heure de Tunis', () => {
    const { aVenir } = classerMesRendezVous(
      [rdv('minuit', { debut: '2026-11-30T23:30:00.000Z' })],
      maintenant,
    );
    expect(aVenir[0]?.titre).toBe('Décembre');
  });
});

describe('actionsRendezVous', () => {
  it('propose Annuler tant que le rendez-vous a venir n a pas commence', () => {
    expect(actionsRendezVous(rdv('a', { statut: 'EN_ATTENTE' }), maintenant)).toEqual(['annuler']);
    expect(actionsRendezVous(rdv('b', { statut: 'CONFIRME' }), maintenant)).toEqual(['annuler']);
    const enCours = rdv('c', { debut: new Date(maintenant.getTime() - 60_000).toISOString() });
    expect(actionsRendezVous(enCours, maintenant)).toEqual([]);
  });

  it('propose un avis et une nouvelle reservation sur un rendez-vous termine sans avis', () => {
    const termine = rdv('t', { statut: 'TERMINE', debut: jours(-3) });
    expect(actionsRendezVous(termine, maintenant)).toEqual(['avis', 'reserverANouveau']);
    expect(actionsRendezVous({ ...termine, aAvis: true }, maintenant)).toEqual([]);
  });

  it('propose de reserver ailleurs apres une annulation, un refus ou une expiration', () => {
    for (const statut of ['ANNULE', 'REFUSE', 'EXPIRE'] as const) {
      expect(actionsRendezVous(rdv(statut, { statut, debut: jours(-2) }), maintenant)).toEqual([
        'reserverAilleurs',
      ]);
    }
  });

  it('propose de reserver a nouveau un rendez-vous confirme deja passe', () => {
    expect(actionsRendezVous(rdv('p', { debut: jours(-2) }), maintenant)).toEqual([
      'reserverANouveau',
    ]);
  });
});

describe('infoRendezVous', () => {
  it('dit qui a annule, pourquoi, et si c etait tardif', () => {
    expect(
      infoRendezVous(
        rdv('a', { statut: 'ANNULE', annulePar: 'fournisseur', motif: 'Pièce indisponible' }),
        maintenant,
      ),
    ).toBe('Annulé par Garage Mansour · Pièce indisponible');
    expect(
      infoRendezVous(
        rdv('b', {
          statut: 'ANNULE',
          annulePar: 'client',
          motif: 'Un imprévu',
          annulationTardive: true,
        }),
        maintenant,
      ),
    ).toBe('Annulé par vous · Un imprévu · moins de 2 h avant');
    expect(infoRendezVous(rdv('c', { statut: 'ANNULE', annulePar: 'systeme' }), maintenant)).toBe(
      'Annulé automatiquement',
    );
  });

  it('donne le motif d un refus et explique une expiration', () => {
    expect(
      infoRendezVous(
        rdv('r', { statut: 'REFUSE', motif: 'Pas disponible à cette heure' }),
        maintenant,
      ),
    ).toBe('Motif : Pas disponible à cette heure');
    expect(infoRendezVous(rdv('r2', { statut: 'REFUSE' }), maintenant)).toBeNull();
    expect(infoRendezVous(rdv('e', { statut: 'EXPIRE' }), maintenant)).toBe(
      'Sans réponse avant la date limite',
    );
    expect(infoRendezVous(rdv('t', { statut: 'TERMINE' }), maintenant)).toBeNull();
  });
});

describe('une demande sans reponse apres sa date limite', () => {
  const morte = rdv('morte', {
    statut: 'EN_ATTENTE',
    debut: jours(1),
    dateLimiteReponse: new Date(maintenant.getTime() - 60_000).toISOString(),
  });

  it('se lit expiree avant le passage du worker, et reste en attente avant la date limite', () => {
    expect(statutAffiche(morte, maintenant)).toBe('EXPIRE');
    expect(statutAffiche({ ...morte, dateLimiteReponse: jours(1, '05:00') }, maintenant)).toBe(
      'EN_ATTENTE',
    );
    expect(statutAffiche(rdv('c', { statut: 'CONFIRME' }), maintenant)).toBe('CONFIRME');
  });

  it('passe dans les rendez-vous passes, sans Annuler, avec la raison', () => {
    const { aVenir, passes } = classerMesRendezVous([morte], maintenant);
    expect(aVenir).toEqual([]);
    expect(ids(passes.flatMap((s) => s.rendezVous))).toEqual(['morte']);
    expect(actionsRendezVous(morte, maintenant)).toEqual(['reserverAilleurs']);
    expect(infoRendezVous(morte, maintenant)).toBe('Sans réponse avant la date limite');
  });
});

describe('abonnerRendezVous', () => {
  it('ne transmet que les lignes ou l utilisateur est client ou pro, et rend le desabonnement', () => {
    let rappel: ((m: { events: string[]; payload: unknown }) => void) | null = null;
    const canaux: unknown[] = [];
    let desabonne = false;
    const client = {
      subscribe: (
        c: string | string[],
        cb: (m: { events: string[]; payload: unknown }) => void,
      ) => {
        canaux.push(c);
        rappel = cb;
        return () => {
          desabonne = true;
        };
      },
    };
    const recus: string[] = [];
    const arreter = abonnerRendezVous(
      client,
      'tablesdb.fixa.tables.rendez_vous.rows',
      'karim',
      (r) => recus.push(r.$id),
    );
    const envoyer = (payload: unknown) =>
      (rappel as unknown as (m: { events: string[]; payload: unknown }) => void)({
        events: [],
        payload,
      });
    envoyer(rdv('du-pro', { fournisseurId: 'karim', clientId: 'yasmine' }));
    envoyer(rdv('du-client', { fournisseurId: 'amira', clientId: 'karim' }));
    envoyer(rdv('autre', { fournisseurId: 'amira', clientId: 'mehdi' }));
    envoyer({ $id: 'pas-un-rdv' });
    expect(canaux).toEqual(['tablesdb.fixa.tables.rendez_vous.rows']);
    expect(recus).toEqual(['du-pro', 'du-client']);
    arreter();
    expect(desabonne).toBe(true);
  });
});
