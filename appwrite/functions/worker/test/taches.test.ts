import type { RendezVous } from '@fixa/core';
import { fauxDb, panneUneFois } from '@fixa/fn-commun/faux';
import { describe, expect, it } from 'vitest';
import { executerTick } from '../src/taches';

const maintenant = new Date('2026-11-21T10:00:00.000Z');
const ilYa = (minutes: number) => new Date(maintenant.getTime() - minutes * 60_000).toISOString();

const rdv = (id: string, extra: Partial<RendezVous>) => ({
  $id: id,
  clientId: 'u-yasmine',
  fournisseurId: 'u-karim',
  serviceId: 's-karim-fuite',
  statut: 'CONFIRME',
  debut: ilYa(-24 * 60),
  duree: 60,
  dateLimiteReponse: ilYa(-60),
  motif: null,
  ...extra,
});

function base() {
  const db = fauxDb({ creneaux_occupes: [['fournisseurId', 'cellule']] });
  db.inserer('rendez_vous', [
    rdv('expire', { statut: 'EN_ATTENTE', dateLimiteReponse: ilYa(1) }),
    rdv('attente', { statut: 'EN_ATTENTE', dateLimiteReponse: ilYa(-30) }),
    rdv('fini', { debut: ilYa(60 + 121), duree: 60 }),
    rdv('recent', { debut: ilYa(60 + 60), duree: 60 }),
  ]);
  db.inserer('creneaux_occupes', [
    { $id: 'c1', rendezVousId: 'expire', fournisseurId: 'u-karim', cellule: 'a' },
    { $id: 'c2', rendezVousId: 'expire', fournisseurId: 'u-karim', cellule: 'b' },
    { $id: 'c3', rendezVousId: 'attente', fournisseurId: 'u-karim', cellule: 'c' },
  ]);
  return db;
}

const statut = (db: ReturnType<typeof base>, id: string) => db.table('rendez_vous').get(id)?.statut;

describe('executerTick', () => {
  it('expires a request past its deadline and frees its cells', async () => {
    const db = base();
    const r = await executerTick(db, maintenant);
    expect(r.expires).toBe(1);
    expect(statut(db, 'expire')).toBe('EXPIRE');
    expect(statut(db, 'attente')).toBe('EN_ATTENTE');
    expect(db.table('creneaux_occupes').rows.map((c) => c.$id)).toEqual(['c3']);
  });

  it('completes a confirmed appointment that ended 2 h 1 min ago, not one that ended 1 h ago', async () => {
    const db = base();
    const r = await executerTick(db, maintenant);
    expect(r.termines).toBe(1);
    expect(statut(db, 'fini')).toBe('TERMINE');
    expect(statut(db, 'recent')).toBe('CONFIRME');
  });

  it('changes nothing on a second run', async () => {
    const db = base();
    await executerTick(db, maintenant);
    const avant = JSON.stringify(db.table('rendez_vous').rows);
    expect(await executerTick(db, maintenant)).toEqual({ expires: 0, termines: 0 });
    expect(JSON.stringify(db.table('rendez_vous').rows)).toBe(avant);
  });

  it('leaves a request the provider answered in the same moment', async () => {
    const db = base();
    db.inserer('transitions', [
      { $id: 'expire.EN_ATTENTE', rendezVousId: 'expire', de: 'EN_ATTENTE', vers: 'CONFIRME' },
    ]);
    const r = await executerTick(db, maintenant);
    expect(r.expires).toBe(0);
    expect(statut(db, 'expire')).toBe('EN_ATTENTE');
  });
});

describe('executerTick after a server error', () => {
  it('retries a request whose update failed, without stopping the rest of the tick', async () => {
    const db = base();
    const erreurs: string[] = [];
    const r = await executerTick(panneUneFois(db, 'updateRow', 'rendez_vous'), maintenant, (m) =>
      erreurs.push(m),
    );
    expect(r).toEqual({ expires: 0, termines: 1 });
    expect(erreurs).toHaveLength(1);
    expect(statut(db, 'expire')).toBe('EN_ATTENTE');
    expect(await executerTick(db, maintenant)).toEqual({ expires: 1, termines: 0 });
    expect(statut(db, 'expire')).toBe('EXPIRE');
  });

  it('frees the cells on the next tick when a release failed', async () => {
    const db = base();
    await executerTick(panneUneFois(db, 'deleteRow', 'creneaux_occupes'), maintenant);
    await executerTick(db, maintenant);
    expect(statut(db, 'expire')).toBe('EXPIRE');
    expect(db.table('creneaux_occupes').rows.map((c) => c.$id)).toEqual(['c3']);
  });
});
