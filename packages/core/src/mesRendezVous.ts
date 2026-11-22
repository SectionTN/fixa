import type { RendezVous, StatutRendezVous } from './domaine';
import { fr } from './i18n/fr';
import { delaiDepasse } from './reservation';
import { dateLocale } from './temps';
import { appliquerAction } from './transitions';

const t = fr.rendezVous;
const MINUTE_MS = 60_000;
const SEMAINE_MS = 7 * 24 * 60 * MINUTE_MS;

export type SectionRendezVous<T extends RendezVous> = { titre: string; rendezVous: T[] };
export type ActionClient = 'annuler' | 'avis' | 'reserverANouveau' | 'reserverAilleurs';

const fin = (r: Pick<RendezVous, 'debut' | 'duree'>) => Date.parse(r.debut) + r.duree * MINUTE_MS;

// A request past its response deadline reads as expired before the worker writes it.
export function statutAffiche(r: RendezVous, maintenant: Date): StatutRendezVous {
  return delaiDepasse(r, maintenant) ? 'EXPIRE' : r.statut;
}

export function estAVenir(r: RendezVous, maintenant: Date): boolean {
  const statut = statutAffiche(r, maintenant);
  return (statut === 'EN_ATTENTE' || statut === 'CONFIRME') && fin(r) > maintenant.getTime();
}

// Month name in Tunis time, with the year only when it is not the current one.
function titreMois(iso: string, maintenant: Date): string {
  const [annee, mois] = dateLocale(iso).split('-').map(Number);
  const nom = fr.temps.mois[(mois ?? 1) - 1] ?? '';
  const titre = `${nom.charAt(0).toUpperCase()}${nom.slice(1)}`;
  return annee === Number(dateLocale(maintenant.toISOString()).slice(0, 4))
    ? titre
    : `${titre} ${annee}`;
}

function grouper<T extends RendezVous>(
  liste: T[],
  titre: (r: T) => string,
): SectionRendezVous<T>[] {
  const sections: SectionRendezVous<T>[] = [];
  for (const r of liste) {
    const nom = titre(r);
    const derniere = sections.at(-1);
    if (derniere?.titre === nom) derniere.rendezVous.push(r);
    else sections.push({ titre: nom, rendezVous: [r] });
  }
  return sections;
}

// Upcoming: open and not ended, soonest first, the next 7 days then by month. Past: the rest, newest first, by month.
export function classerMesRendezVous<T extends RendezVous>(
  liste: T[],
  maintenant: Date,
): { aVenir: SectionRendezVous<T>[]; passes: SectionRendezVous<T>[] } {
  const parDebut = (a: T, b: T) => Date.parse(a.debut) - Date.parse(b.debut);
  const aVenir = liste.filter((r) => estAVenir(r, maintenant)).sort(parDebut);
  const passes = liste.filter((r) => !estAVenir(r, maintenant)).sort((a, b) => parDebut(b, a));
  const semaine = maintenant.getTime() + SEMAINE_MS;
  return {
    aVenir: grouper(aVenir, (r) =>
      Date.parse(r.debut) < semaine ? t.cetteSemaine : titreMois(r.debut, maintenant),
    ),
    passes: grouper(passes, (r) => titreMois(r.debut, maintenant)),
  };
}

// What the client can do from the card. The cancel rule is the one the function applies.
export function actionsRendezVous(r: RendezVous, maintenant: Date): ActionClient[] {
  if (estAVenir(r, maintenant)) {
    const annulation = appliquerAction(
      r,
      'annuler',
      { id: r.clientId, role: 'client' },
      maintenant,
    );
    return annulation.ok ? ['annuler'] : [];
  }
  switch (statutAffiche(r, maintenant)) {
    case 'TERMINE':
      return r.aAvis ? [] : ['avis', 'reserverANouveau'];
    case 'CONFIRME':
      return ['reserverANouveau'];
    default:
      return ['reserverAilleurs'];
  }
}

// The line under a closed appointment: who cancelled and why, the refusal reason, or the missed deadline.
export function infoRendezVous(r: RendezVous, maintenant: Date): string | null {
  switch (statutAffiche(r, maintenant)) {
    case 'ANNULE': {
      const qui =
        r.annulePar === 'client'
          ? t.annuleParVous
          : r.annulePar === 'fournisseur'
            ? t.annulePar(r.fournisseurNom)
            : t.annuleAuto;
      return [qui, r.motif, r.annulationTardive ? t.tardive : null].filter(Boolean).join(' · ');
    }
    case 'REFUSE':
      return r.motif ? t.motifRefus(r.motif) : null;
    case 'EXPIRE':
      return t.sansReponse;
    default:
      return null;
  }
}

/** The legacy `client.subscribe` of the Appwrite SDKs, which returns its unsubscribe. */
export interface AbonneurLike {
  subscribe(
    canaux: string | string[],
    rappel: (message: { events: string[]; payload: unknown }) => void,
  ): () => void;
}

const estRendezVous = (p: unknown): p is RendezVous =>
  typeof p === 'object' &&
  p !== null &&
  typeof (p as RendezVous).clientId === 'string' &&
  typeof (p as RendezVous).fournisseurId === 'string';

// Hands over every change to a row where the user is the client or the provider.
export function abonnerRendezVous(
  client: AbonneurLike,
  canal: string,
  userId: string,
  surChangement: (rdv: RendezVous) => void,
): () => void {
  return client.subscribe(canal, ({ payload }) => {
    if (!estRendezVous(payload)) return;
    if (payload.clientId === userId || payload.fournisseurId === userId) surChangement(payload);
  });
}
