import type { JourSemaine } from './domaine';
import { textes } from './i18n/textes';

// Tunis is UTC+1 all year, so a fixed shift avoids Intl time zones, which Hermes handles unevenly.
export const DECALAGE_TUNIS_MIN = 60;

const MINUTE_MS = 60_000;

const deux = (n: number) => String(n).padStart(2, '0');

// A Date whose UTC fields read as Tunis wall time.
function murTunis(iso: string): Date {
  return new Date(Date.parse(iso) + DECALAGE_TUNIS_MIN * MINUTE_MS);
}

export function heureLocale(iso: string): string {
  const d = murTunis(iso);
  return `${deux(d.getUTCHours())}:${deux(d.getUTCMinutes())}`;
}

export function dateLocale(iso: string): string {
  const d = murTunis(iso);
  return `${d.getUTCFullYear()}-${deux(d.getUTCMonth() + 1)}-${deux(d.getUTCDate())}`;
}

export function jourLocal(iso: string): string {
  const d = murTunis(iso);
  return `${textes.temps.jours[d.getUTCDay()]} ${d.getUTCDate()} ${textes.temps.mois[d.getUTCMonth()]}`;
}

export function jourCourtLocal(iso: string): string {
  const d = murTunis(iso);
  return `${textes.temps.joursCourts[d.getUTCDay()]} ${d.getUTCDate()} ${textes.temps.moisCourts[d.getUTCMonth()]}`;
}

// The date block of an appointment card, such as LUN over 26.
export function blocDateLocal(iso: string): { jour: string; numero: string } {
  const d = murTunis(iso);
  const jour = textes.temps.joursCourts[d.getUTCDay()] ?? '';
  return { jour: jour.replace('.', '').toUpperCase(), numero: String(d.getUTCDate()) };
}

export function jourSemaineLocal(iso: string): JourSemaine {
  const jour = murTunis(iso).getUTCDay();
  return (jour === 0 ? 7 : jour) as JourSemaine;
}

export function versUtc(date: string, heure: string): string {
  const [annee, mois, jour] = date.split('-').map(Number);
  const [h, m] = heure.split(':').map(Number);
  const mur = Date.UTC(annee ?? 0, (mois ?? 1) - 1, jour ?? 1, h ?? 0, m ?? 0);
  return new Date(mur - DECALAGE_TUNIS_MIN * MINUTE_MS).toISOString();
}

export function ajouterMinutes(iso: string, minutes: number): string {
  return new Date(Date.parse(iso) + minutes * MINUTE_MS).toISOString();
}

export function ajouterJours(date: string, jours: number): string {
  const [annee, mois, jour] = date.split('-').map(Number);
  const d = new Date(Date.UTC(annee ?? 0, (mois ?? 1) - 1, (jour ?? 1) + jours));
  return d.toISOString().slice(0, 10);
}
