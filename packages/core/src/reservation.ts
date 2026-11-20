import { creneauxLibres } from './creneaux';
import type { RendezVous, Service, StatutRendezVous } from './domaine';
import { JOURS_FERIES_TN } from './feries';
import { fr } from './i18n/fr';
import { LONGUEUR_MAX } from './limites';
import { type CreneauxFournisseur, ecartDepuis, formatDuree, JOURS_RECHERCHE } from './recherche';
import { ajouterJours, dateLocale, heureLocale, jourCourtLocal, jourSemaineLocal } from './temps';

const MINUTE_MS = 60_000;

export type Creneau = { debut: string; libre: boolean };

export function joursReservation(maintenant: Date): string[] {
  const aujourdhui = dateLocale(maintenant.toISOString());
  return Array.from({ length: JOURS_RECHERCHE }, (_, i) => ajouterJours(aujourdhui, i));
}

// Every start the provider could take that day for this duration, marked taken when a booked cell blocks it.
export function creneauxDuJour(p: {
  jour: string;
  dureeMin: number;
  creneaux: CreneauxFournisseur;
  maintenant: Date;
}): Creneau[] {
  const commun = {
    jour: p.jour,
    dureeMin: p.dureeMin,
    disponibilites: p.creneaux.disponibilites,
    conges: p.creneaux.conges,
    joursFeries: JOURS_FERIES_TN,
    maintenant: p.maintenant,
  };
  const libres = new Set(creneauxLibres({ ...commun, occupees: p.creneaux.occupees }));
  return creneauxLibres({ ...commun, occupees: [] }).map((debut) => ({
    debut,
    libre: libres.has(debut),
  }));
}

export function parMoment(liste: Creneau[]): { matin: Creneau[]; apresMidi: Creneau[] } {
  return {
    matin: liste.filter((c) => heureLocale(c.debut) < '12:00'),
    apresMidi: liste.filter((c) => heureLocale(c.debut) >= '12:00'),
  };
}

export type OngletDemande = 'attente' | 'acceptees' | 'refusees';

export function ongletDemande(statut: StatutRendezVous): OngletDemande {
  if (statut === 'EN_ATTENTE') return 'attente';
  if (statut === 'CONFIRME' || statut === 'TERMINE') return 'acceptees';
  return 'refusees';
}

// The worker expires these later, until then the screens must not offer Accepter.
export function delaiDepasse(
  rdv: Pick<RendezVous, 'statut' | 'dateLimiteReponse'>,
  maintenant: Date,
): boolean {
  return rdv.statut === 'EN_ATTENTE' && Date.parse(rdv.dateLimiteReponse) < maintenant.getTime();
}

// The requests a provider can still answer, the one count the tab badge, the list tab and the home card show.
export function nbARepondre(
  liste: readonly Pick<RendezVous, 'statut' | 'dateLimiteReponse'>[],
  maintenant: Date,
): number {
  return liste.filter((r) => r.statut === 'EN_ATTENTE' && !delaiDepasse(r, maintenant)).length;
}

export function libelleAvant(limite: string, maintenant: Date): string {
  const heure = heureLocale(limite);
  const ecart = ecartDepuis(limite, maintenant);
  if (ecart === 0) return fr.demandes.avant(heure);
  if (ecart === 1) return fr.demandes.avantDemain(heure);
  return fr.demandes.avantLe(fr.temps.jours[jourSemaineLocal(limite) % 7] ?? '', heure);
}

export function tempsRestant(limite: string, maintenant: Date): string | null {
  const minutes = Math.floor((Date.parse(limite) - maintenant.getTime()) / MINUTE_MS);
  return minutes > 0 ? formatDuree(minutes) : null;
}

const jourCourt = (iso: string) => jourCourtLocal(iso).toLowerCase();

export function ilYA(iso: string, maintenant: Date): string {
  const minutes = Math.floor((maintenant.getTime() - Date.parse(iso)) / MINUTE_MS);
  if (minutes < 1) return fr.demandes.aLInstant;
  if (minutes < 60) return fr.demandes.ilYAMin(minutes);
  if (minutes < 24 * 60) return fr.demandes.ilYAH(Math.floor(minutes / 60));
  return fr.demandes.leJour(jourCourt(iso));
}

export function libelleRecue(iso: string, maintenant: Date): string {
  const heure = heureLocale(iso);
  const ecart = ecartDepuis(iso, maintenant);
  if (ecart === 0) return fr.demandes.aujourdhuiA(heure);
  if (ecart === -1) return fr.demandes.hierA(heure);
  return fr.demandes.leA(jourCourt(iso), heure);
}

export function adresseManquante(service: Pick<Service, 'aDomicile'>, adresse: string): boolean {
  return service.aDomicile && adresse.trim() === '';
}

// The route stores one motif, so the reason and the optional message share its column.
export function motifRefus(raison: string, message: string): string {
  const texte = message.trim();
  return (texte ? `${raison} : ${texte}` : raison).slice(0, LONGUEUR_MAX.motif);
}
