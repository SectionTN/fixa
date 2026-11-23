import { File, Paths } from 'expo-file-system';
import { useSyncExternalStore } from 'react';

// Kept on the device for each account until favourites get a table on the server.
const fichier = (uid: string) => new File(Paths.document, `favoris-${uid}.json`);
const abonnes = new Set<() => void>();
const cache = new Map<string, readonly string[]>();
const AUCUN: readonly string[] = [];

function lire(uid: string): readonly string[] {
  try {
    const f = fichier(uid);
    if (!f.exists) return AUCUN;
    const ids: unknown = JSON.parse(f.textSync());
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : AUCUN;
  } catch {
    return AUCUN;
  }
}

function abonner(abonne: () => void) {
  abonnes.add(abonne);
  return () => {
    abonnes.delete(abonne);
  };
}

function idsDe(uid: string): readonly string[] {
  const enCache = cache.get(uid);
  if (enCache) return enCache;
  const ids = lire(uid);
  cache.set(uid, ids);
  return ids;
}

// The account's favourite pro ids, newest first, and the same empty list for a visitor.
export function useFavoris(uid: string | null): readonly string[] {
  return useSyncExternalStore(abonner, () => (uid ? idsDe(uid) : AUCUN));
}

// Adds or removes a pro, and returns whether it is now a favourite.
export function basculerFavori(uid: string, proId: string): boolean {
  const avant = idsDe(uid);
  const estFavori = !avant.includes(proId);
  const apres = estFavori ? [proId, ...avant] : avant.filter((id) => id !== proId);
  cache.set(uid, apres);
  for (const abonne of abonnes) abonne();
  // A failed write only loses the change on the next launch.
  fichier(uid)
    .write(JSON.stringify(apres))
    .catch(() => {});
  return estFavori;
}
