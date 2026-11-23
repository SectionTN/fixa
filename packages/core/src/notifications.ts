import type { RendezVousLu } from './donnees';
import { ajouterMinutes, dateLocale } from './temps';

export type GenreNotification = 'confirme' | 'envoye' | 'refuse' | 'annule' | 'expire' | 'avis';

export type NotificationClient = {
  id: string;
  genre: GenreNotification;
  /** When the event happened, ISO. */
  quand: string;
  rdv: RendezVousLu;
};

export type SectionNotifications = {
  cle: 'aujourdhui' | 'semaine' | 'plusTot';
  notifications: NotificationClient[];
};

const JOUR_MS = 24 * 60 * 60 * 1000;
const LIMITE = 20;

// The row's last write, which is when its status last moved.
const modifieLe = (r: RendezVousLu & { $updatedAt?: string }) => r.$updatedAt ?? r.$createdAt;

// What a client hears about one booking, or null when there is nothing to tell (their own cancellation).
function notificationDe(r: RendezVousLu): NotificationClient | null {
  const base = { id: `${r.$id}:${r.statut}`, rdv: r };
  switch (r.statut) {
    case 'EN_ATTENTE':
      return { ...base, genre: 'envoye', quand: r.$createdAt };
    case 'CONFIRME':
      return { ...base, genre: 'confirme', quand: modifieLe(r) };
    case 'REFUSE':
      return { ...base, genre: 'refuse', quand: modifieLe(r) };
    case 'EXPIRE':
      return { ...base, genre: 'expire', quand: r.dateLimiteReponse };
    case 'ANNULE':
      return r.annulePar === 'client' ? null : { ...base, genre: 'annule', quand: modifieLe(r) };
    case 'TERMINE':
      return r.aAvis ? null : { ...base, genre: 'avis', quand: ajouterMinutes(r.debut, r.duree) };
  }
}

// The client's notifications, newest first, derived from their bookings.
export function notificationsClient(liste: RendezVousLu[]): NotificationClient[] {
  return liste
    .map(notificationDe)
    .filter((n): n is NotificationClient => n !== null)
    .sort((a, b) => Date.parse(b.quand) - Date.parse(a.quand))
    .slice(0, LIMITE);
}

// Today, the last seven days, then the rest, by Tunis calendar day.
export function sectionnerNotifications(
  liste: NotificationClient[],
  maintenant: Date,
): SectionNotifications[] {
  const aujourdhui = dateLocale(maintenant.toISOString());
  const semaine = maintenant.getTime() - 7 * JOUR_MS;
  const sections: SectionNotifications[] = [
    { cle: 'aujourdhui', notifications: [] },
    { cle: 'semaine', notifications: [] },
    { cle: 'plusTot', notifications: [] },
  ];
  for (const n of liste) {
    const i = dateLocale(n.quand) === aujourdhui ? 0 : Date.parse(n.quand) >= semaine ? 1 : 2;
    sections[i]?.notifications.push(n);
  }
  return sections.filter((s) => s.notifications.length > 0);
}

// Unread when it happened after the last "mark all read".
export const estNonLue = (n: NotificationClient, luesJusqua: string | null) =>
  luesJusqua === null || Date.parse(n.quand) > Date.parse(luesJusqua);
