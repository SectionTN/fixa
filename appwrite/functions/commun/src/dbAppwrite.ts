import { type Client, ID, Query, TablesDB, Users } from 'node-appwrite';
import type { Db, Ligne, Requete } from './db';

const LIMITE_PAR_DEFAUT = 100;

function requetes(r?: Requete): string[] {
  const q: string[] = [];
  for (const [champ, valeur] of Object.entries(r?.egal ?? {})) {
    q.push(Query.equal(champ, Array.isArray(valeur) ? valeur : [valeur]));
  }
  if (r?.entre) q.push(Query.between(r.entre.champ, r.entre.min, r.entre.max));
  q.push(Query.limit(r?.limite ?? LIMITE_PAR_DEFAUT));
  return q;
}

const estIntrouvable = (e: unknown) => (e as { code?: unknown })?.code === 404;

// Db over node-appwrite, with a client already carrying the function's API key.
export function dbAppwrite(client: Client, databaseId: string): Db {
  const tables = new TablesDB(client);
  const users = new Users(client);
  return {
    nouvelId: () => ID.unique(),
    async getRow<T extends Ligne>(tableId: string, rowId: string) {
      try {
        return (await tables.getRow({ databaseId, tableId, rowId })) as unknown as T;
      } catch (e) {
        if (estIntrouvable(e)) return null;
        throw e;
      }
    },
    async listRows<T extends Ligne>(tableId: string, requete?: Requete) {
      const { rows } = await tables.listRows({ databaseId, tableId, queries: requetes(requete) });
      return rows as unknown as T[];
    },
    async createRow<T extends Ligne>(
      tableId: string,
      rowId: string,
      data: Omit<T, '$id'>,
      permissions?: string[],
    ) {
      const ligne = await tables.createRow({
        databaseId,
        tableId,
        rowId,
        data: data as Record<string, unknown>,
        permissions,
      });
      return ligne as unknown as T;
    },
    async updateRow<T extends Ligne>(
      tableId: string,
      rowId: string,
      data: Partial<Omit<T, '$id'>>,
    ) {
      const ligne = await tables.updateRow({
        databaseId,
        tableId,
        rowId,
        data: data as Record<string, unknown>,
      });
      return ligne as unknown as T;
    },
    async deleteRow(tableId: string, rowId: string) {
      await tables.deleteRow({ databaseId, tableId, rowId });
    },
    async getUser(userId: string) {
      try {
        const u = await users.get({ userId });
        return { $id: u.$id, labels: u.labels };
      } catch (e) {
        if (estIntrouvable(e)) return null;
        throw e;
      }
    },
    async updateLabels(userId: string, labels: string[]) {
      await users.updateLabels({ userId, labels });
    },
  };
}
