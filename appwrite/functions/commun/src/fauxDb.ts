import type { Db, Ligne, Requete, Utilisateur, Valeur } from './db';

class ErreurFaux extends Error {
  constructor(
    readonly code: number,
    message: string,
  ) {
    super(message);
  }
}

type Brute = Ligne & Record<string, unknown>;
type Stockee = { ligne: Brute; permissions: string[] };

// Every method yields once before touching the tables, so concurrent calls interleave like requests.
const tour = () => Promise.resolve();

function correspond(ligne: Brute, requete?: Requete): boolean {
  for (const [champ, attendu] of Object.entries(requete?.egal ?? {})) {
    const valeur = ligne[champ] as Valeur;
    if (Array.isArray(attendu) ? !attendu.includes(valeur) : valeur !== attendu) return false;
  }
  const entre = requete?.entre;
  if (entre) {
    const valeur = String(ligne[entre.champ]);
    if (valeur < entre.min || valeur > entre.max) return false;
  }
  return true;
}

// In-memory tables with Appwrite's unique indexes, keyed by table name.
export function fauxDb(uniques: Record<string, string[][]> = {}) {
  const tables = new Map<string, Map<string, Stockee>>();
  const utilisateurs = new Map<string, Utilisateur>();
  let compteur = 0;

  const table = (nom: string) => {
    let t = tables.get(nom);
    if (!t) {
      t = new Map();
      tables.set(nom, t);
    }
    return t;
  };

  const verifierUniques = (nom: string, ligne: Brute) => {
    const t = table(nom);
    if (t.has(ligne.$id)) throw new ErreurFaux(409, `${nom}/${ligne.$id} existe deja`);
    for (const champs of uniques[nom] ?? []) {
      const doublon = [...t.values()].some((s) => champs.every((c) => s.ligne[c] === ligne[c]));
      if (doublon) throw new ErreurFaux(409, `${nom} index unique ${champs.join(',')}`);
    }
  };

  const db: Db = {
    nouvelId: () => `id-${++compteur}`,
    async getRow<T extends Ligne>(nom: string, id: string) {
      await tour();
      const s = table(nom).get(id);
      return s ? ({ ...s.ligne } as T) : null;
    },
    async listRows<T extends Ligne>(nom: string, requete?: Requete) {
      await tour();
      const lignes = [...table(nom).values()]
        .map((s) => s.ligne)
        .filter((l) => correspond(l, requete));
      return lignes.slice(0, requete?.limite ?? 100).map((l) => ({ ...l }) as T);
    },
    async createRow<T extends Ligne>(
      nom: string,
      id: string,
      data: Omit<T, '$id'>,
      permissions: string[] = [],
    ) {
      await tour();
      const ligne = { ...data, $id: id } as Brute;
      verifierUniques(nom, ligne);
      table(nom).set(id, { ligne, permissions });
      return { ...ligne } as T;
    },
    async updateRow<T extends Ligne>(nom: string, id: string, data: Partial<Omit<T, '$id'>>) {
      await tour();
      const s = table(nom).get(id);
      if (!s) throw new ErreurFaux(404, `${nom}/${id} introuvable`);
      s.ligne = { ...s.ligne, ...data };
      return { ...s.ligne } as T;
    },
    async deleteRow(nom: string, id: string) {
      await tour();
      if (!table(nom).delete(id)) throw new ErreurFaux(404, `${nom}/${id} introuvable`);
    },
    async getUser(id: string) {
      await tour();
      const u = utilisateurs.get(id);
      return u ? { ...u, labels: [...u.labels] } : null;
    },
    async updateLabels(id: string, labels: string[]) {
      await tour();
      const u = utilisateurs.get(id);
      if (!u) throw new ErreurFaux(404, `utilisateur ${id} introuvable`);
      u.labels = [...labels];
    },
  };

  return {
    ...db,
    inserer(nom: string, lignes: Brute[]) {
      for (const ligne of lignes)
        table(nom).set(ligne.$id, { ligne: { ...ligne }, permissions: [] });
    },
    utilisateurs(liste: Utilisateur[]) {
      for (const u of liste) utilisateurs.set(u.$id, { ...u, labels: [...u.labels] });
    },
    table(nom: string) {
      const t = table(nom);
      return {
        rows: [...t.values()].map((s) => s.ligne) as Array<Record<string, unknown>>,
        get: (id: string) => t.get(id)?.ligne as Record<string, unknown> | undefined,
      };
    },
    permissions: (nom: string, id: string) => table(nom).get(id)?.permissions,
    labels: (id: string) => utilisateurs.get(id)?.labels,
  };
}

export type FauxDb = ReturnType<typeof fauxDb>;

// The same tables, where the first call of `methode` on `table` fails like a server error.
export function panneUneFois(db: Db, methode: 'updateRow' | 'deleteRow', table: string): Db {
  let restantes = 1;
  const appeler = db[methode] as (nom: string, ...reste: unknown[]) => Promise<never>;
  return {
    ...db,
    [methode]: async (nom: string, ...reste: unknown[]) => {
      if (nom === table && restantes > 0) {
        restantes -= 1;
        throw new ErreurFaux(503, `${nom} indisponible`);
      }
      return appeler(nom, ...reste);
    },
  };
}
