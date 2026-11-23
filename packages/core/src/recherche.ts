import { formatPrix } from './argent';
import { distanceKm } from './classement';
import { creneauxLibres } from './creneaux';
import type { Categorie, Conge, Disponibilite, Fournisseur, Service } from './domaine';
import { JOURS_FERIES_TN } from './feries';
import { textes } from './i18n/textes';
import { ajouterJours, dateLocale, heureLocale, jourSemaineLocal } from './temps';

// Badges, the availability filter and "Cette semaine" all look this many days ahead.
export const JOURS_RECHERCHE = 7;
const LONGUEUR_MIN_RECHERCHE = 3;

export type Position = { lat: number; lng: number };

export type CreneauxFournisseur = {
  disponibilites: Disponibilite[];
  conges: Conge[];
  occupees: string[];
};

export type FournisseurAffiche = Fournisseur & {
  specialite: string | null;
  distanceKm: number | null;
  prochainCreneau: string | null;
  joursLibres: string[];
  prixDepart: string | null;
};

export type FiltreDispo = 'aujourdhui' | 'demain' | 'semaine';

export type Filtres = {
  ville: string | null;
  noteMin: number;
  prixPlancher: number;
  prixPlafond: number | null;
  dispo: FiltreDispo | null;
};

export const FILTRES_VIDES: Filtres = {
  ville: null,
  noteMin: 0,
  prixPlancher: 0,
  prixPlafond: null,
  dispo: null,
};

export function formatDistance(km: number): string {
  return `${km.toFixed(1).replace('.', ',')} km`;
}

export function formatDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const reste = minutes % 60;
  return reste === 0 ? `${minutes / 60} h` : `${Math.floor(minutes / 60)} h ${reste}`;
}

export function nomCourt(nom: string): string {
  const [prenom = '', ...suite] = nom.trim().split(/\s+/);
  const initiale = suite[0]?.[0];
  return initiale ? `${prenom} ${initiale.toUpperCase()}.` : prenom;
}

export function initiales(nom: string): string {
  const mots = nom
    .trim()
    .split(/\s+/)
    .filter((m) => !/^dr\.?$/i.test(m));
  return mots
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase() ?? '')
    .join('');
}

// Days between two Tunis dates 'YYYY-MM-DD'.
function ecartJours(de: string, a: string): number {
  return Math.round((Date.parse(a) - Date.parse(de)) / 86_400_000);
}

// Days from the Tunis date of `maintenant` to the Tunis date of `iso`, negative in the past.
export function ecartDepuis(iso: string, maintenant: Date): number {
  return ecartJours(dateLocale(maintenant.toISOString()), dateLocale(iso));
}

export function libelleCreneau(iso: string, maintenant: Date): string {
  const ecart = ecartDepuis(iso, maintenant);
  const jour =
    ecart === 0
      ? textes.recherche.aujourdhui
      : ecart === 1
        ? textes.recherche.demain
        : textes.temps.joursCourts[jourSemaineLocal(iso) % 7];
  return `${jour} ${heureLocale(iso)}`;
}

export function libelleDispo(iso: string, maintenant: Date): string {
  const ecart = ecartDepuis(iso, maintenant);
  if (ecart === 0) return textes.recherche.dispoAujourdhui;
  if (ecart === 1) return textes.recherche.dispoDemain;
  return textes.recherche.dispoLe(textes.temps.jours[jourSemaineLocal(iso) % 7] ?? '');
}

export function libelleDispoDes(iso: string, maintenant: Date): string {
  return textes.recherche.dispoDes(libelleDispo(iso, maintenant), heureLocale(iso));
}

// "dès" unless a single fixed price, "Sur devis" when nothing has a price.
export function prixDepart(services: Pick<Service, 'typePrix' | 'prix'>[]): string | null {
  const avecPrix = services.flatMap((s) =>
    s.typePrix !== 'SUR_DEVIS' && s.prix !== null ? [{ typePrix: s.typePrix, prix: s.prix }] : [],
  );
  const [premier, ...autres] = avecPrix.sort((a, b) => a.prix - b.prix);
  if (!premier) return services.length > 0 ? textes.prix.surDevis : null;
  if (autres.length === 0 && premier.typePrix === 'FIXE') return formatPrix(premier.prix);
  return `${textes.prix.aPartirDe} ${formatPrix(premier.prix)}`;
}

// Availability uses each provider's shortest visible service, so a shown start can always be booked.
export function preparerFournisseurs(p: {
  fournisseurs: Fournisseur[];
  services: Service[];
  creneaux: Record<string, CreneauxFournisseur>;
  specialites: Record<string, string>;
  position: Position | null;
  maintenant: Date;
}): FournisseurAffiche[] {
  const aujourdhui = dateLocale(p.maintenant.toISOString());
  const jours = Array.from({ length: JOURS_RECHERCHE }, (_, i) => ajouterJours(aujourdhui, i));
  return p.fournisseurs.map((f) => {
    const services = p.services.filter((s) => s.fournisseurId === f.$id && s.estVisible);
    const creneaux = p.creneaux[f.$id];
    const premiers =
      services.length > 0 && creneaux
        ? jours.map(
            (jour) =>
              creneauxLibres({
                ...creneaux,
                jour,
                dureeMin: Math.min(...services.map((s) => s.duree)),
                joursFeries: JOURS_FERIES_TN,
                maintenant: p.maintenant,
              })[0] ?? null,
          )
        : [];
    // A new provider's row starts at 0, 0 until an address is set.
    const situe =
      p.position &&
      typeof f.latitude === 'number' &&
      typeof f.longitude === 'number' &&
      !(f.latitude === 0 && f.longitude === 0);
    return {
      ...f,
      specialite: p.specialites[f.$id] ?? null,
      distanceKm:
        situe && p.position ? distanceKm(p.position, { lat: f.latitude, lng: f.longitude }) : null,
      prochainCreneau: premiers.find((c) => c !== null) ?? null,
      joursLibres: jours.filter((_, i) => premiers[i]),
      prixDepart: prixDepart(services),
    };
  });
}

export function nbFiltresActifs(f: Filtres): number {
  return [
    f.ville !== null,
    f.noteMin > 0,
    f.prixPlancher > 0 || f.prixPlafond !== null,
    f.dispo !== null,
  ].filter(Boolean).length;
}

export function filtrerFournisseurs(
  liste: FournisseurAffiche[],
  f: Filtres,
  maintenant: Date,
): FournisseurAffiche[] {
  const aujourdhui = dateLocale(maintenant.toISOString());
  const filtrePrix = f.prixPlancher > 0 || f.prixPlafond !== null;
  return liste.filter((x) => {
    if (f.ville !== null && x.ville !== f.ville) return false;
    if (x.noteMoyenne < f.noteMin) return false;
    if (filtrePrix) {
      if (x.prixMin === null || x.prixMin < f.prixPlancher) return false;
      if (f.prixPlafond !== null && x.prixMin > f.prixPlafond) return false;
    }
    if (f.dispo === 'aujourdhui') return x.joursLibres.includes(aujourdhui);
    if (f.dispo === 'demain') return x.joursLibres.includes(ajouterJours(aujourdhui, 1));
    if (f.dispo === 'semaine') return x.joursLibres.length > 0;
    return true;
  });
}

// Rating first, then the nearest, then the most reviewed when no distance is known.
export function mieuxNotes<
  T extends { noteMoyenne: number; nbAvis: number; distanceKm: number | null },
>(liste: T[], n: number): T[] {
  return [...liste]
    .sort(
      (a, b) =>
        b.noteMoyenne - a.noteMoyenne ||
        (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY) ||
        b.nbAvis - a.nbAvis,
    )
    .slice(0, n);
}

const sansAccents = (texte: string) =>
  texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// A trade or category word searches its categories, anything else searches provider names.
export function interpreterRecherche(
  texte: string,
  categories: Categorie[],
): { categorieIds: string[] } | { nom: string } | null {
  const q = sansAccents(texte);
  if (q.length < LONGUEUR_MIN_RECHERCHE) return null;
  const categorieIds = categories.filter((c) => categorieCorrespond(c, q)).map((c) => c.$id);
  return categorieIds.length > 0 ? { categorieIds } : { nom: texte.trim() };
}

// q is already without accents. A word and the query match when one starts with the other.
function categorieCorrespond(c: Categorie, q: string): boolean {
  return [c.nom, ...(textes.recherche.motsCles[c.$id] ?? [])].some((mot) => {
    const m = sansAccents(mot);
    return m.startsWith(q) || q.startsWith(m);
  });
}

// Refines a loaded list while the user types, without a request.
export function correspondRecherche(
  pro: Pick<FournisseurAffiche, 'nom' | 'specialite' | 'categorieId'>,
  texte: string,
  categories: Categorie[],
): boolean {
  const q = sansAccents(texte);
  if (q.length === 0) return true;
  if (sansAccents(pro.nom).includes(q)) return true;
  if (pro.specialite && sansAccents(pro.specialite).includes(q)) return true;
  const categorie = categories.find((c) => c.$id === pro.categorieId);
  return (
    q.length >= LONGUEUR_MIN_RECHERCHE &&
    categorie !== undefined &&
    categorieCorrespond(categorie, q)
  );
}
