import { BASE } from '@fixa/core';
import { Client, Query, TablesDB, Users } from 'node-appwrite';
import { donnees, type LigneSemee, type NomTable } from './donnees';

const PAR_LOT = 10;
const PAGE = 100;
const REMISES_A_ZERO: NomTable[] = ['avis', 'rendez_vous', 'creneaux_occupes', 'transitions'];
const REMETTRE_MOTS_DE_PASSE = process.argv.includes('--mots-de-passe');

async function idsDe(tablesDb: TablesDB, table: string): Promise<string[]> {
  const ids: string[] = [];
  for (;;) {
    const apres = ids.at(-1);
    const { rows } = await tablesDb.listRows({
      databaseId: BASE,
      tableId: table,
      queries: [
        Query.select(['$id']),
        Query.limit(PAGE),
        ...(apres ? [Query.cursorAfter(apres)] : []),
      ],
    });
    ids.push(...rows.map((r) => r.$id));
    if (rows.length < PAGE) return ids;
  }
}

function variable(nom: string): string {
  const valeur = process.env[nom];
  if (!valeur) throw new Error(`${nom} manque dans .env.local`);
  return valeur;
}

const code = (e: unknown) => (e as { code?: number } | null)?.code;

async function parLots<T>(elements: T[], action: (e: T) => Promise<unknown>) {
  for (let i = 0; i < elements.length; i += PAR_LOT) {
    await Promise.all(elements.slice(i, i + PAR_LOT).map(action));
  }
}

async function semer() {
  const motDePasse = variable('SEED_MOT_DE_PASSE');
  const client = new Client()
    .setEndpoint(variable('APPWRITE_ENDPOINT'))
    .setProject(variable('APPWRITE_PROJECT_ID'))
    .setKey(variable('APPWRITE_API_KEY'));
  const users = new Users(client);
  const tablesDb = new TablesDB(client);
  const d = donnees(new Date());

  let crees = 0;
  await parLots(d.comptes, async (c) => {
    try {
      await users.create({ userId: c.$id, email: c.email, password: motDePasse, name: c.nom });
      crees++;
    } catch (e) {
      if (code(e) !== 409) throw e;
      // A password reset revokes the account's sessions, so it only runs on request.
      if (REMETTRE_MOTS_DE_PASSE)
        await users.updatePassword({ userId: c.$id, password: motDePasse });
    }
    await users.updateLabels({ userId: c.$id, labels: c.labels });
    await users.updateEmailVerification({ userId: c.$id, emailVerification: true });
  });
  console.log(`comptes: ${d.comptes.length} (${crees} crees)`);

  // Booking tables are emptied so seeded rows get a fresh $createdAt that matches their deadlines.
  for (const table of REMISES_A_ZERO) {
    const ids = await idsDe(tablesDb, table);
    await parLots(ids, (rowId) => tablesDb.deleteRow({ databaseId: BASE, tableId: table, rowId }));
    console.log(`${table}: ${ids.length} lignes supprimees`);
  }

  for (const table of Object.keys(d.tables) as NomTable[]) {
    const lignes: LigneSemee<{ $id: string }>[] = d.tables[table];
    await parLots(lignes, ({ ligne, permissions }) => {
      const { $id, ...data } = ligne;
      return tablesDb.upsertRow({
        databaseId: BASE,
        tableId: table,
        rowId: $id,
        data,
        permissions,
      });
    });
    console.log(`${table}: ${d.tables[table].length}`);
  }
}

semer().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
