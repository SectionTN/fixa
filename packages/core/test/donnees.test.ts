import { describe, expect, it } from 'vitest';
import {
  ancienneteAValider,
  compterTableauDeBord,
  donneesCreneaux,
  getFournisseur,
  getProfil,
  getRendezVous,
  type LecteurTables,
  lireMesRendezVous,
  listerAvis,
  listerCategories,
  listerRendezVousClient,
  listerRendezVousFournisseur,
  listerServices,
  type RequeteLike,
  rechercherFournisseurs,
  specialitesDe,
  type TablesLike,
} from '../src/donnees';

const Q: RequeteLike = {
  equal: (a, v) => `equal ${a} ${JSON.stringify(v)}`,
  greaterThanEqual: (a, v) => `gte ${a} ${v}`,
  lessThan: (a, v) => `lt ${a} ${v}`,
  lessThanEqual: (a, v) => `lte ${a} ${v}`,
  search: (a, v) => `search ${a} ${v}`,
  limit: (n) => `limit ${n}`,
  select: (a) => `select ${a.join(',')}`,
  orderDesc: (a) => `desc ${a}`,
  orderAsc: (a) => `asc ${a}`,
};

function tables(totaux: Record<string, number>) {
  const appels: { tableId: string; queries: string[] }[] = [];
  const db: TablesLike = {
    listRows: async ({ tableId, queries = [] }) => {
      appels.push({ tableId, queries });
      const filtres = queries.filter((q) => !q.startsWith('limit') && !q.startsWith('select'));
      return { total: totaux[[tableId, ...filtres].join('|')] ?? 0, rows: [] };
    },
  };
  return { db, appels };
}

const totaux = {
  profils: 13,
  'fournisseurs|equal statutVerification "VALIDE"|equal visible true': 8,
  'rendez_vous|gte debut 2026-10-31T23:00:00.000Z|lt debut 2026-11-30T23:00:00.000Z': 4,
  'rendez_vous|gte debut 2026-11-30T23:00:00.000Z|lt debut 2026-12-31T23:00:00.000Z': 1,
  'fournisseurs|equal statutVerification "EN_ATTENTE"': 1,
};

describe('ancienneteAValider', () => {
  it('compte les jours depuis le plus ancien dossier en attente, null sans dossier', async () => {
    const appels: string[][] = [];
    const avec = (rows: { $id: string; $createdAt: string }[]): TablesLike => ({
      listRows: async ({ queries = [] }) => {
        appels.push(queries);
        return { total: rows.length, rows };
      },
    });
    const vieux = { $id: 'u-walid', $createdAt: '2026-11-15T08:00:00.000+00:00' };
    expect(await ancienneteAValider(avec([vieux]), Q, new Date('2026-11-17T22:30:00Z'))).toBe(2);
    expect(appels[0]).toEqual([
      'equal statutVerification "EN_ATTENTE"',
      'asc $createdAt',
      'select $id,$createdAt',
      'limit 1',
    ]);
    expect(await ancienneteAValider(avec([]), Q, new Date())).toBeNull();
  });
});

describe('compterTableauDeBord', () => {
  it('compte comptes, prestataires actifs, reservations du mois de Tunis et dossiers', async () => {
    const { db, appels } = tables(totaux);
    const r = await compterTableauDeBord(db, Q, new Date('2026-11-17T22:30:00Z'));
    expect(r).toEqual({ utilisateurs: 13, fournisseursActifs: 8, rendezVousMois: 4, aValider: 1 });
    for (const a of appels) expect(a.queries).toContain('limit 1');
  });

  it('change de mois a minuit heure de Tunis, pas a minuit UTC', async () => {
    const { db } = tables(totaux);
    const r = await compterTableauDeBord(db, Q, new Date('2026-11-30T23:30:00Z'));
    expect(r.rendezVousMois).toBe(1);
  });
});

// A reader that serves fixed rows per table and records every query.
function lecteur(
  lignes: Record<string, Record<string, unknown>[]>,
  introuvable = new Set<string>(),
) {
  const appels: { tableId: string; queries: string[] }[] = [];
  const db: LecteurTables = {
    listRows: async ({ tableId, queries = [] }) => {
      appels.push({ tableId, queries });
      const rows = (lignes[tableId] ?? []).map((l, i) => ({ $id: `r${i}`, $createdAt: '', ...l }));
      return { total: rows.length, rows };
    },
    getRow: async ({ tableId, rowId }) => {
      if (introuvable.has(rowId)) throw Object.assign(new Error('Row not found'), { code: 404 });
      if (rowId === 'panne') throw Object.assign(new Error('Server error'), { code: 500 });
      return { $id: rowId, $createdAt: '', table: tableId };
    },
  };
  return { db, appels };
}

describe('lectures de la recherche', () => {
  it('lit les categories actives dans l ordre', async () => {
    const { db, appels } = lecteur({ categories: [{ nom: 'Plomberie' }] });
    expect(await listerCategories(db, Q)).toHaveLength(1);
    expect(appels[0]?.queries).toEqual(['equal estActive true', 'asc ordre', 'limit 25']);
  });

  it('cherche les pros visibles par categories ou par nom', async () => {
    const { db, appels } = lecteur({});
    await rechercherFournisseurs(db, Q, { categorieIds: ['plomberie'] });
    await rechercherFournisseurs(db, Q, { nom: 'Karim' });
    expect(appels[0]?.queries).toEqual([
      'equal visible true',
      'equal categorieId ["plomberie"]',
      'limit 100',
    ]);
    expect(appels[1]?.queries).toEqual(['equal visible true', 'search nom Karim', 'limit 100']);
  });

  it('range disponibilites, conges et cases prises par pro', async () => {
    const { db, appels } = lecteur({
      disponibilites: [
        { fournisseurId: 'karim', jour: 1, debut: '08:00', fin: '12:00' },
        { fournisseurId: 'sami', jour: 1, debut: '14:00', fin: '18:00' },
      ],
      conges: [{ fournisseurId: 'sami', debut: '2026-11-20', fin: '2026-11-21' }],
      creneaux_occupes: [{ fournisseurId: 'karim', cellule: '2026-11-19T07:30:00.000Z' }],
    });
    const r = await donneesCreneaux(
      db,
      Q,
      ['karim', 'sami'],
      '2026-11-18T09:00:00.000Z',
      '2026-11-25T23:00:00.000Z',
    );
    expect(r.karim?.disponibilites.map((d) => d.debut)).toEqual(['08:00']);
    expect(r.karim?.occupees).toEqual(['2026-11-19T07:30:00.000Z']);
    expect(r.karim?.conges).toEqual([]);
    expect(r.sami?.conges).toHaveLength(1);
    expect(r.sami?.occupees).toEqual([]);
    for (const a of appels) expect(a.queries.some((q) => q.startsWith('limit'))).toBe(true);
    const cases = appels.find((a) => a.tableId === 'creneaux_occupes')?.queries ?? [];
    expect(cases).toContain('gte cellule 2026-11-18T09:00:00.000Z');
    expect(cases).toContain('lt cellule 2026-11-25T23:00:00.000Z');
  });

  it('ne fait aucun appel pour une liste vide', async () => {
    const { db, appels } = lecteur({});
    expect(await donneesCreneaux(db, Q, [], 'a', 'b')).toEqual({});
    expect(await specialitesDe(db, Q, [])).toEqual({});
    expect(await listerServices(db, Q, [])).toEqual([]);
    expect(appels).toEqual([]);
  });

  it('garde la premiere specialite de chaque pro', async () => {
    const { db, appels } = lecteur({
      profils: [
        { $id: 'karim', specialites: ['Plombier', 'Chauffagiste'] },
        { $id: 'nadia', specialites: [] },
      ],
    });
    expect(await specialitesDe(db, Q, ['karim', 'nadia'])).toEqual({ karim: 'Plombier' });
    expect(appels[0]?.queries).toEqual([
      'equal $id ["karim","nadia"]',
      'select $id,specialites',
      'limit 2',
    ]);
  });

  it('lit les services visibles et les derniers avis avec une limite', async () => {
    const { db, appels } = lecteur({});
    await listerServices(db, Q, ['karim']);
    await listerAvis(db, Q, 'karim', 3);
    expect(appels[0]?.queries).toEqual([
      'equal fournisseurId ["karim"]',
      'equal estVisible true',
      'limit 50',
    ]);
    expect(appels[1]?.queries).toEqual([
      'equal fournisseurId "karim"',
      'desc $createdAt',
      'limit 3',
    ]);
  });

  it('rend null pour une ligne absente et laisse passer les autres erreurs', async () => {
    const { db } = lecteur({}, new Set(['absent']));
    expect(await getFournisseur(db, 'karim')).toMatchObject({
      $id: 'karim',
      table: 'fournisseurs',
    });
    expect(await getFournisseur(db, 'absent')).toBeNull();
    expect(await getProfil(db, 'absent')).toBeNull();
    await expect(getFournisseur(db, 'panne')).rejects.toThrow('Server error');
  });
});

const ids = (liste: { $id: string }[]) => liste.map((r) => r.$id);

describe('lectures des rendez-vous', () => {
  it("lit les rendez-vous d'un pro, les plus recents d'abord, avec une limite", async () => {
    const { db, appels } = lecteur({
      rendez_vous: [{ fournisseurId: 'karim', debut: '2026-11-19T07:30:00Z' }],
    });
    const liste = await listerRendezVousFournisseur(db, Q, 'karim');
    expect(liste).toHaveLength(1);
    expect(liste[0]).toHaveProperty('$createdAt');
    expect(appels[0]?.queries).toEqual(['equal fournisseurId "karim"', 'desc debut', 'limit 100']);
  });

  it("lit les rendez-vous d'un client, les plus recents d'abord, avec une limite", async () => {
    const { db, appels } = lecteur({ rendez_vous: [{ clientId: 'yasmine' }] });
    expect(await listerRendezVousClient(db, Q, 'yasmine')).toHaveLength(1);
    expect(appels[0]?.queries).toEqual(['equal clientId "yasmine"', 'desc debut', 'limit 100']);
  });

  it('lit les notes des seuls rendez-vous notes et le lieu de chaque pro une fois', async () => {
    const { db, appels } = lecteur({
      rendez_vous: [
        { $id: 'r1', fournisseurId: 'karim', aAvis: true },
        { $id: 'r2', fournisseurId: 'karim', aAvis: false },
        { $id: 'r3', fournisseurId: 'leila', aAvis: true },
      ],
      avis: [
        { rendezVousId: 'r1', note: 5 },
        { rendezVousId: 'r3', note: 4 },
      ],
      fournisseurs: [
        { $id: 'karim', ville: 'La Marsa', categorieId: 'plomberie' },
        { $id: 'leila', ville: 'Ennasr', categorieId: 'beaute' },
      ],
    });
    const lu = await lireMesRendezVous(db, Q, 'yasmine');
    expect(ids(lu.liste)).toEqual(['r1', 'r2', 'r3']);
    expect(lu.notes).toEqual({ r1: 5, r3: 4 });
    expect(lu.pros).toEqual({
      karim: { ville: 'La Marsa', categorieId: 'plomberie' },
      leila: { ville: 'Ennasr', categorieId: 'beaute' },
    });
    expect(appels.slice(1).map((a) => [a.tableId, a.queries])).toEqual([
      ['avis', ['equal rendezVousId ["r1","r3"]', 'select rendezVousId,note', 'limit 2']],
      ['fournisseurs', ['equal $id ["karim","leila"]', 'select $id,ville,categorieId', 'limit 2']],
    ]);
  });

  it("ne lit ni avis ni pros quand le client n'a aucun rendez-vous", async () => {
    const { db, appels } = lecteur({});
    expect(await lireMesRendezVous(db, Q, 'yasmine')).toEqual({ liste: [], notes: {}, pros: {} });
    expect(appels).toHaveLength(1);
  });

  it('rend null pour un rendez-vous absent', async () => {
    const { db } = lecteur({}, new Set(['absent']));
    expect(await getRendezVous(db, 'r1')).toMatchObject({ $id: 'r1', table: 'rendez_vous' });
    expect(await getRendezVous(db, 'absent')).toBeNull();
  });
});
