export type Valeur = string | number | boolean | null;
export type Ligne = { $id: string };

export interface Requete {
  egal?: Record<string, Valeur | Valeur[]>;
  entre?: { champ: string; min: string; max: string };
  limite?: number;
}

export interface Utilisateur {
  $id: string;
  labels: string[];
}

// Appwrite's storage, reduced to what the functions use, so tests can swap in fauxDb.
export interface Db {
  nouvelId(): string;
  getRow<T extends Ligne>(table: string, id: string): Promise<T | null>;
  listRows<T extends Ligne>(table: string, requete?: Requete): Promise<T[]>;
  createRow<T extends Ligne>(
    table: string,
    id: string,
    data: Omit<T, '$id'>,
    permissions?: string[],
  ): Promise<T>;
  updateRow<T extends Ligne>(table: string, id: string, data: Partial<Omit<T, '$id'>>): Promise<T>;
  deleteRow(table: string, id: string): Promise<void>;
  getUser(id: string): Promise<Utilisateur | null>;
  updateLabels(id: string, labels: string[]): Promise<void>;
}

const codeDe = (erreur: unknown) =>
  typeof erreur === 'object' && erreur !== null ? (erreur as { code?: unknown }).code : undefined;

// Appwrite answers 409 when a row id or a unique index already exists.
export const estConflit = (erreur: unknown) => codeDe(erreur) === 409;

export const estAbsent = (erreur: unknown) => codeDe(erreur) === 404;
