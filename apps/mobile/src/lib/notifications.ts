import { File, Paths } from 'expo-file-system';
import { useSyncExternalStore } from 'react';

// One file per account, so a second account on the same phone keeps its own unread dots.
const fichier = (uid: string) => new File(Paths.document, `notifications-lues-${uid}.txt`);
const abonnes = new Set<() => void>();
const cache = new Map<string, string | null>();

function lire(uid: string): string | null {
  try {
    const f = fichier(uid);
    return f.exists ? f.textSync().trim() || null : null;
  } catch {
    return null;
  }
}

function abonner(abonne: () => void) {
  abonnes.add(abonne);
  return () => {
    abonnes.delete(abonne);
  };
}

// The time of the account's last "mark all read", null before the first one.
export function useLuesJusqua(uid: string | null): string | null {
  return useSyncExternalStore(abonner, () => {
    if (!uid) return null;
    if (!cache.has(uid)) cache.set(uid, lire(uid));
    return cache.get(uid) ?? null;
  });
}

export function toutLire(uid: string) {
  const quand = new Date().toISOString();
  cache.set(uid, quand);
  for (const abonne of abonnes) abonne();
  // A failed write only brings the dots back on the next launch.
  fichier(uid)
    .write(quand)
    .catch(() => {});
}
