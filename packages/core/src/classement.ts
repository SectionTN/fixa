const RAYON_TERRE_KM = 6371;

const radians = (degres: number) => (degres * Math.PI) / 180;

export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAYON_TERRE_KM * Math.asin(Math.sqrt(h));
}

// Ascending, with null after every value.
function croissant<V extends string | number>(a: V | null, b: V | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? -1 : 1;
}

export function trierFournisseurs<
  T extends {
    prochainCreneau: string | null;
    distanceKm: number | null;
    noteMoyenne: number;
    prixMin: number | null;
  },
>(liste: T[]): T[] {
  return [...liste].sort(
    (a, b) =>
      croissant(a.prochainCreneau, b.prochainCreneau) ||
      croissant(a.distanceKm, b.distanceKm) ||
      b.noteMoyenne - a.noteMoyenne ||
      croissant(a.prixMin, b.prixMin),
  );
}
