import { DELAI_MINIMAL_RESERVATION_MIN } from './delais';
import type { Conge, Disponibilite } from './domaine';
import { ajouterJours, ajouterMinutes, dateLocale, jourSemaineLocal, versUtc } from './temps';

export const PAS_MIN = 30;

const MINUTE_MS = 60_000;

export function cellules(debutIso: string, dureeMin: number): string[] {
  const nombre = Math.ceil(dureeMin / PAS_MIN);
  return Array.from({ length: nombre }, (_, i) => ajouterMinutes(debutIso, i * PAS_MIN));
}

type ParamsCreneaux = {
  jour: string;
  dureeMin: number;
  disponibilites: Disponibilite[];
  conges: Conge[];
  joursFeries: readonly string[];
  occupees: readonly string[];
  maintenant: Date;
};

export function creneauxLibres(p: ParamsCreneaux): string[] {
  if (p.joursFeries.includes(p.jour)) return [];
  if (p.conges.some((c) => c.debut <= p.jour && p.jour <= c.fin)) return [];

  const jourSemaine = jourSemaineLocal(versUtc(p.jour, '12:00'));
  const occupees = new Set(p.occupees.map((iso) => new Date(iso).toISOString()));
  const auPlusTot = p.maintenant.getTime() + DELAI_MINIMAL_RESERVATION_MIN * MINUTE_MS;
  const libres: string[] = [];

  for (const dispo of p.disponibilites) {
    if (dispo.jour !== jourSemaine) continue;
    const ouverture = versUtc(p.jour, dispo.debut);
    const fermeture = Date.parse(versUtc(p.jour, dispo.fin));
    for (let debut = ouverture; ; debut = ajouterMinutes(debut, PAS_MIN)) {
      const cases = cellules(debut, p.dureeMin);
      const derniere = cases.at(-1) ?? debut;
      if (Date.parse(derniere) + PAS_MIN * MINUTE_MS > fermeture) break;
      if (Date.parse(debut) < auPlusTot) continue;
      if (cases.some((c) => occupees.has(c))) continue;
      libres.push(debut);
    }
  }
  return libres.sort();
}

export function prochainCreneau(
  p: Omit<ParamsCreneaux, 'jour'> & { joursMax: number },
): string | null {
  const aujourdhui = dateLocale(p.maintenant.toISOString());
  for (let i = 0; i < p.joursMax; i++) {
    const [premier] = creneauxLibres({ ...p, jour: ajouterJours(aujourdhui, i) });
    if (premier) return premier;
  }
  return null;
}
