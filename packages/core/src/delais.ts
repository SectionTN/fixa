import type { RendezVous } from './domaine';

export const DELAI_REPONSE_MIN = 120;
export const MARGE_AVANT_RDV_MIN = 60;
export const ANNULATION_GRATUITE_MIN = 120;
export const AUTO_TERMINE_MIN = 120;
export const DELAI_MINIMAL_RESERVATION_MIN = 90;

const MINUTE_MS = 60_000;

export function dateLimiteReponse(creation: Date, debut: Date): Date {
  const apresCreation = creation.getTime() + DELAI_REPONSE_MIN * MINUTE_MS;
  const avantRdv = debut.getTime() - MARGE_AVANT_RDV_MIN * MINUTE_MS;
  return new Date(Math.min(apresCreation, avantRdv));
}

export function estAnnulationTardive(debut: Date, maintenant: Date): boolean {
  return debut.getTime() - maintenant.getTime() < ANNULATION_GRATUITE_MIN * MINUTE_MS;
}

export function doitExpirer(
  rdv: Pick<RendezVous, 'statut' | 'dateLimiteReponse'>,
  maintenant: Date,
): boolean {
  return rdv.statut === 'EN_ATTENTE' && maintenant.getTime() > Date.parse(rdv.dateLimiteReponse);
}

export function doitTerminerAuto(
  rdv: Pick<RendezVous, 'statut' | 'debut' | 'duree'>,
  maintenant: Date,
): boolean {
  const fin = Date.parse(rdv.debut) + rdv.duree * MINUTE_MS;
  return rdv.statut === 'CONFIRME' && maintenant.getTime() >= fin + AUTO_TERMINE_MIN * MINUTE_MS;
}
