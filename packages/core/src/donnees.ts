import type {
  Avis,
  Categorie,
  Conge,
  CreneauOccupe,
  Disponibilite,
  Fournisseur,
  Profil,
  RendezVous,
  Service,
} from './domaine';
import { BASE, TABLES } from './ids';
import type { CreneauxFournisseur } from './recherche';
import { dateLocale, versUtc } from './temps';

// The reads both apps run, typed against the shape the web and React Native TablesDB services share.
export interface TablesLike {
  listRows(params: {
    databaseId: string;
    tableId: string;
    queries?: string[];
    total?: boolean;
  }): Promise<{ total: number; rows: { $id: string; $createdAt: string }[] }>;
}

type LigneLue = { $id: string; $createdAt: string } & Record<string, unknown>;

// Reads of a single row by id, which only the screens that open one provider need.
export interface LecteurTables extends TablesLike {
  getRow(params: {
    databaseId: string;
    tableId: string;
    rowId: string;
    queries?: string[];
  }): Promise<LigneLue>;
}

// The Query static methods both SDKs export.
export interface RequeteLike {
  equal(attribut: string, valeur: string | number | boolean | string[]): string;
  greaterThanEqual(attribut: string, valeur: string | number): string;
  lessThan(attribut: string, valeur: string | number): string;
  lessThanEqual(attribut: string, valeur: string | number): string;
  search(attribut: string, valeur: string): string;
  limit(n: number): string;
  select(attributs: string[]): string;
  orderDesc(attribut: string): string;
  orderAsc(attribut: string): string;
}

export type TableauDeBord = {
  utilisateurs: number;
  fournisseursActifs: number;
  rendezVousMois: number;
  aValider: number;
};

// First instant of the Tunis month holding `maintenant`, and of the next one, in UTC.
function moisDeTunis(maintenant: Date): [string, string] {
  const [annee = 0, mois = 1] = dateLocale(maintenant.toISOString()).split('-').map(Number);
  const suivant = mois === 12 ? `${annee + 1}-01` : `${annee}-${String(mois + 1).padStart(2, '0')}`;
  return [
    versUtc(`${annee}-${String(mois).padStart(2, '0')}-01`, '00:00'),
    versUtc(`${suivant}-01`, '00:00'),
  ];
}

export async function compterTableauDeBord(
  db: TablesLike,
  Q: RequeteLike,
  maintenant: Date = new Date(),
): Promise<TableauDeBord> {
  const compter = async (tableId: string, filtres: string[] = []) =>
    (
      await db.listRows({
        databaseId: BASE,
        tableId,
        queries: [...filtres, Q.select(['$id']), Q.limit(1)],
      })
    ).total;
  const [debut, fin] = moisDeTunis(maintenant);
  const [utilisateurs, fournisseursActifs, rendezVousMois, aValider] = await Promise.all([
    compter(TABLES.profils),
    compter(TABLES.fournisseurs, [
      Q.equal('statutVerification', 'VALIDE'),
      Q.equal('visible', true),
    ]),
    compter(TABLES.rendezVous, [Q.greaterThanEqual('debut', debut), Q.lessThan('debut', fin)]),
    compter(TABLES.fournisseurs, [Q.equal('statutVerification', 'EN_ATTENTE')]),
  ]);
  return { utilisateurs, fournisseursActifs, rendezVousMois, aValider };
}

const JOUR_MS = 86_400_000;

// Whole days since the oldest provider file still waiting for validation, null when none waits.
export async function ancienneteAValider(
  db: TablesLike,
  Q: RequeteLike,
  maintenant: Date = new Date(),
): Promise<number | null> {
  const { rows } = await db.listRows({
    databaseId: BASE,
    tableId: TABLES.fournisseurs,
    queries: [
      Q.equal('statutVerification', 'EN_ATTENTE'),
      Q.orderAsc('$createdAt'),
      Q.select(['$id', '$createdAt']),
      Q.limit(1),
    ],
  });
  const plusAncien = rows[0];
  if (!plusAncien) return null;
  return Math.floor((maintenant.getTime() - Date.parse(plusAncien.$createdAt)) / JOUR_MS);
}

// Seven days of two ranges each, the most a provider can declare.
const DISPONIBILITES_PAR_FOURNISSEUR = 14;
const LIMITE_LISTE = 100;
const LIMITE_CASES = 500;

const lignes = async <T>(db: TablesLike, tableId: string, queries: string[]): Promise<T[]> =>
  (await db.listRows({ databaseId: BASE, tableId, queries })).rows as unknown as T[];

export function listerCategories(db: TablesLike, Q: RequeteLike): Promise<Categorie[]> {
  return lignes(db, TABLES.categories, [
    Q.equal('estActive', true),
    Q.orderAsc('ordre'),
    Q.limit(25),
  ]);
}

// Only visible providers, other filters run on the client so counts update without a request.
export function rechercherFournisseurs(
  db: TablesLike,
  Q: RequeteLike,
  f: { categorieIds?: string[]; nom?: string },
): Promise<Fournisseur[]> {
  return lignes(db, TABLES.fournisseurs, [
    Q.equal('visible', true),
    ...(f.categorieIds ? [Q.equal('categorieId', f.categorieIds)] : []),
    ...(f.nom ? [Q.search('nom', f.nom)] : []),
    Q.limit(LIMITE_LISTE),
  ]);
}

export async function specialitesDe(
  db: TablesLike,
  Q: RequeteLike,
  ids: string[],
): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const profils = await lignes<Pick<Profil, '$id' | 'specialites'>>(db, TABLES.profils, [
    Q.equal('$id', ids),
    Q.select(['$id', 'specialites']),
    Q.limit(ids.length),
  ]);
  return Object.fromEntries(
    profils.flatMap((p) => (p.specialites[0] ? [[p.$id, p.specialites[0]]] : [])),
  );
}

export async function listerServices(
  db: TablesLike,
  Q: RequeteLike,
  fournisseurIds: string[],
): Promise<Service[]> {
  if (fournisseurIds.length === 0) return [];
  return lignes(db, TABLES.services, [
    Q.equal('fournisseurId', fournisseurIds),
    Q.equal('estVisible', true),
    Q.limit(50 * fournisseurIds.length),
  ]);
}

export function listerAvis(
  db: TablesLike,
  Q: RequeteLike,
  fournisseurId: string,
  limite: number,
): Promise<Avis[]> {
  return lignes(db, TABLES.avis, [
    Q.equal('fournisseurId', fournisseurId),
    Q.orderDesc('$createdAt'),
    Q.limit(limite),
  ]);
}

// Rows grouped per provider, since the slot functions never filter by fournisseurId.
export async function donneesCreneaux(
  db: TablesLike,
  Q: RequeteLike,
  fournisseurIds: string[],
  depuis: string,
  jusqua: string,
): Promise<Record<string, CreneauxFournisseur>> {
  if (fournisseurIds.length === 0) return {};
  const [dispos, conges, cases] = await Promise.all([
    lignes<Disponibilite>(db, TABLES.disponibilites, [
      Q.equal('fournisseurId', fournisseurIds),
      Q.limit(DISPONIBILITES_PAR_FOURNISSEUR * fournisseurIds.length),
    ]),
    lignes<Conge>(db, TABLES.conges, [
      Q.equal('fournisseurId', fournisseurIds),
      Q.greaterThanEqual('fin', dateLocale(depuis)),
      Q.lessThanEqual('debut', dateLocale(jusqua)),
      Q.limit(LIMITE_LISTE),
    ]),
    lignes<Pick<CreneauOccupe, 'fournisseurId' | 'cellule'>>(db, TABLES.creneauxOccupes, [
      Q.equal('fournisseurId', fournisseurIds),
      Q.greaterThanEqual('cellule', depuis),
      Q.lessThan('cellule', jusqua),
      Q.select(['fournisseurId', 'cellule']),
      Q.limit(LIMITE_CASES),
    ]),
  ]);
  return Object.fromEntries(
    fournisseurIds.map((id) => [
      id,
      {
        disponibilites: dispos.filter((d) => d.fournisseurId === id),
        conges: conges.filter((c) => c.fournisseurId === id),
        occupees: cases.filter((c) => c.fournisseurId === id).map((c) => c.cellule),
      },
    ]),
  );
}

const estIntrouvable = (e: unknown) =>
  typeof e === 'object' && e !== null && (e as { code?: unknown }).code === 404;

async function ligneOuNull<T>(
  db: LecteurTables,
  tableId: string,
  rowId: string,
): Promise<T | null> {
  try {
    return (await db.getRow({ databaseId: BASE, tableId, rowId })) as unknown as T;
  } catch (e) {
    if (estIntrouvable(e)) return null;
    throw e;
  }
}

export function getFournisseur(db: LecteurTables, id: string): Promise<Fournisseur | null> {
  return ligneOuNull(db, TABLES.fournisseurs, id);
}

export function getProfil(db: LecteurTables, id: string): Promise<Profil | null> {
  return ligneOuNull(db, TABLES.profils, id);
}

export type RendezVousLu = RendezVous & { $createdAt: string };

// The newest starts first, so a long history never pushes the open requests out of the limit.
export function listerRendezVousFournisseur(
  db: TablesLike,
  Q: RequeteLike,
  fournisseurId: string,
): Promise<RendezVousLu[]> {
  return lignes(db, TABLES.rendezVous, [
    Q.equal('fournisseurId', fournisseurId),
    Q.orderDesc('debut'),
    Q.limit(LIMITE_LISTE),
  ]);
}

export function listerRendezVousClient(
  db: TablesLike,
  Q: RequeteLike,
  clientId: string,
): Promise<RendezVousLu[]> {
  return lignes(db, TABLES.rendezVous, [
    Q.equal('clientId', clientId),
    Q.orderDesc('debut'),
    Q.limit(LIMITE_LISTE),
  ]);
}

export type LieuPro = Pick<Fournisseur, 'ville' | 'categorieId'>;

export type MesRendezVous = {
  liste: RendezVousLu[];
  /** The rating given, by appointment id, for the reviewed ones. */
  notes: Record<string, number>;
  pros: Record<string, LieuPro>;
};

// A client's appointments, with the stars of their reviews and each provider's city and category.
export async function lireMesRendezVous(
  db: TablesLike,
  Q: RequeteLike,
  clientId: string,
): Promise<MesRendezVous> {
  const liste = await listerRendezVousClient(db, Q, clientId);
  const notes = liste.filter((r) => r.aAvis).map((r) => r.$id);
  const proIds = [...new Set(liste.map((r) => r.fournisseurId))];
  const [avis, pros] = await Promise.all([
    notes.length === 0
      ? []
      : lignes<Pick<Avis, 'rendezVousId' | 'note'>>(db, TABLES.avis, [
          Q.equal('rendezVousId', notes),
          Q.select(['rendezVousId', 'note']),
          Q.limit(notes.length),
        ]),
    proIds.length === 0
      ? []
      : lignes<LieuPro & { $id: string }>(db, TABLES.fournisseurs, [
          Q.equal('$id', proIds),
          Q.select(['$id', 'ville', 'categorieId']),
          Q.limit(proIds.length),
        ]),
  ]);
  return {
    liste,
    notes: Object.fromEntries(avis.map((a) => [a.rendezVousId, a.note])),
    pros: Object.fromEntries(
      pros.map((p) => [p.$id, { ville: p.ville, categorieId: p.categorieId }]),
    ),
  };
}

export function getRendezVous(db: LecteurTables, id: string): Promise<RendezVousLu | null> {
  return ligneOuNull(db, TABLES.rendezVous, id);
}
