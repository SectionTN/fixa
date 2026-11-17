import { BASE } from '@fixa/core';
import { Client, Query, TablesDB, Users } from 'node-appwrite';
import { donnees, type LigneSemee, type NomTable } from './donnees';

const PAR_LOT = 10;
const PAGE = 100;
const REMISES_A_ZERO: NomTable[] = ['avis', 'rendez_vous', 'creneaux_occupes', 'transitions'];

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
      await users.updatePassword({ userId: c.$id, password: motDePasse });
    }
    await users.updateLabels({ userId: c.$id, labels: c.labels });
    await users.updateEmailVerification({ userId: c.$id, emailVerification: true });
  });
  console.log(`comptes: ${d.comptes.length} (${crees} crees)`);

  // Booking rows the app wrote since the last seed go first, so the demo starts from the seeded state and moved cells free their slot.
  for (const table of REMISES_A_ZERO) {
    const semes = new Set(d.tables[table].map((l) => l.ligne.$id));
    const enTrop = (await idsDe(tablesDb, table)).filter((id) => !semes.has(id));
    await parLots(enTrop, (rowId) =>
      tablesDb.deleteRow({ databaseId: BASE, tableId: table, rowId }),
    );
    if (enTrop.length > 0) console.log(`${table}: ${enTrop.length} lignes hors seed supprimees`);
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
