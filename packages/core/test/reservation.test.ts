import { describe, expect, it } from 'vitest';
import type { Disponibilite } from '../src/domaine';
import {
  creneauxDuJour,
  delaiDepasse,
  ilYA,
  joursReservation,
  libelleAvant,
  libelleRecue,
  motifRefus,
  nbARepondre,
  ongletDemande,
  parMoment,
  tempsRestant,
} from '../src/reservation';
import { heureLocale, versUtc } from '../src/temps';

// Wednesday 18 November 2026, 10:00 in Tunis.
const maintenant = new Date('2026-11-18T09:00:00Z');

// Monday to Saturday, 08:00-12:00 and 14:00-18:00.
const semaine: Disponibilite[] = ([1, 2, 3, 4, 5, 6] as const).flatMap((jour) => [
  { fournisseurId: 'karim', jour, debut: '08:00', fin: '12:00' },
  { fournisseurId: 'karim', jour, debut: '14:00', fin: '18:00' },
]);

const heures = (liste: { debut: string }[]) => liste.map((c) => heureLocale(c.debut));

describe('joursReservation', () => {
  it("donne sept dates de Tunis a partir d'aujourd'hui", () => {
    expect(joursReservation(maintenant)).toEqual([
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
      '2026-11-23',
      '2026-11-24',
    ]);
  });

  it('suit la date de Tunis, pas celle de UTC', () => {
    expect(joursReservation(new Date('2026-11-18T23:30:00Z'))[0]).toBe('2026-11-19');
  });
});

describe('creneauxDuJour', () => {
  const creneaux = (occupees: string[] = []) => ({ disponibilites: semaine, conges: [], occupees });

  it('marque pris les debuts qui touchent une case occupee, pour la duree du service', () => {
    const liste = creneauxDuJour({
      jour: '2026-11-19',
      dureeMin: 45,
      creneaux: creneaux([versUtc('2026-11-19', '08:30'), versUtc('2026-11-19', '09:00')]),
      maintenant,
    });
    const { matin, apresMidi } = parMoment(liste);
    expect(heures(matin)).toEqual(['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00']);
    expect(matin.filter((c) => !c.libre).map((c) => heureLocale(c.debut))).toEqual([
      '08:00',
      '08:30',
      '09:00',
    ]);
    expect(heures(apresMidi)).toEqual([
      '14:00',
      '14:30',
      '15:00',
      '15:30',
      '16:00',
      '16:30',
      '17:00',
    ]);
    expect(apresMidi.every((c) => c.libre)).toBe(true);
  });

  it("ne montre pas comme pris les debuts deja trop proches aujourd'hui", () => {
    const liste = creneauxDuJour({
      jour: '2026-11-18',
      dureeMin: 30,
      creneaux: creneaux(),
      maintenant,
    });
    // 11:30 is the first start 90 min after 10:00.
    expect(heures(liste)[0]).toBe('11:30');
    expect(liste.every((c) => c.libre)).toBe(true);
  });

  it('ne donne rien le dimanche', () => {
    expect(
      creneauxDuJour({ jour: '2026-11-22', dureeMin: 30, creneaux: creneaux(), maintenant }),
    ).toEqual([]);
  });
});

describe('ongletDemande', () => {
  it('range chaque statut dans un des trois onglets', () => {
    expect(ongletDemande('EN_ATTENTE')).toBe('attente');
    expect(ongletDemande('CONFIRME')).toBe('acceptees');
    expect(ongletDemande('TERMINE')).toBe('acceptees');
    expect(ongletDemande('REFUSE')).toBe('refusees');
    expect(ongletDemande('EXPIRE')).toBe('refusees');
    expect(ongletDemande('ANNULE')).toBe('refusees');
  });
});

describe('delais de reponse', () => {
  it("dit qu'une demande en attente a passe sa limite", () => {
    const rdv = { statut: 'EN_ATTENTE' as const, dateLimiteReponse: '2026-11-18T08:59:00Z' };
    expect(delaiDepasse(rdv, maintenant)).toBe(true);
    expect(delaiDepasse({ ...rdv, dateLimiteReponse: '2026-11-18T09:01:00Z' }, maintenant)).toBe(
      false,
    );
    expect(delaiDepasse({ ...rdv, statut: 'CONFIRME' }, maintenant)).toBe(false);
  });

  it('compte les demandes encore a repondre, sans celles hors delai', () => {
    const liste = [
      { statut: 'EN_ATTENTE' as const, dateLimiteReponse: '2026-11-18T09:30:00Z' },
      { statut: 'EN_ATTENTE' as const, dateLimiteReponse: '2026-11-18T08:59:00Z' },
      { statut: 'CONFIRME' as const, dateLimiteReponse: '2026-11-18T09:30:00Z' },
    ];
    expect(nbARepondre(liste, maintenant)).toBe(1);
    expect(nbARepondre([], maintenant)).toBe(0);
  });

  it('ecrit la limite selon le jour de Tunis', () => {
    expect(libelleAvant('2026-11-18T10:15:00Z', maintenant)).toBe('Avant 11:15');
    expect(libelleAvant('2026-11-19T08:00:00Z', maintenant)).toBe('Avant demain 09:00');
    expect(libelleAvant('2026-11-21T08:00:00Z', maintenant)).toBe('Avant samedi 09:00');
  });

  it('donne le temps restant, ou rien une fois la limite passee', () => {
    expect(tempsRestant('2026-11-18T10:58:00Z', maintenant)).toBe('1 h 58');
    expect(tempsRestant('2026-11-18T09:20:00Z', maintenant)).toBe('20 min');
    expect(tempsRestant('2026-11-18T09:00:00Z', maintenant)).toBeNull();
  });
});

describe('dates de reception', () => {
  it('dit depuis quand une demande est arrivee', () => {
    expect(ilYA('2026-11-18T08:59:40Z', maintenant)).toBe("À l'instant");
    expect(ilYA('2026-11-18T08:58:00Z', maintenant)).toBe('Il y a 2 min');
    expect(ilYA('2026-11-18T06:00:00Z', maintenant)).toBe('Il y a 3 h');
    expect(ilYA('2026-11-16T08:00:00Z', maintenant)).toBe('Le lun. 16 nov.');
  });

  it('ecrit le jour de reception en heure de Tunis', () => {
    expect(libelleRecue('2026-11-18T08:15:00Z', maintenant)).toBe("aujourd'hui à 09:15");
    // 23:30 UTC on the 17th is already the 18th in Tunis.
    expect(libelleRecue('2026-11-17T23:30:00Z', maintenant)).toBe("aujourd'hui à 00:30");
    expect(libelleRecue('2026-11-17T08:00:00Z', maintenant)).toBe('hier à 09:00');
    expect(libelleRecue('2026-11-16T08:00:00Z', maintenant)).toBe('le lun. 16 nov. à 09:00');
  });
});

describe('motifRefus', () => {
  it('joint la raison et le message, dans la limite de la colonne', () => {
    expect(motifRefus('Hors de ma zone', '  ')).toBe('Hors de ma zone');
    expect(motifRefus('Hors de ma zone', ' Trop loin pour moi. ')).toBe(
      'Hors de ma zone : Trop loin pour moi.',
    );
    expect(motifRefus('Autre', 'x'.repeat(600))).toHaveLength(500);
  });
});
