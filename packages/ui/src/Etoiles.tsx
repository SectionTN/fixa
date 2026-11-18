import { XStack } from 'tamagui';
import { Icone } from './Icone';

// Five stars, filled up to the rounded rating, the rest drawn in the border colour.
export function Etoiles({
  note,
  libelle,
  taille = 14,
}: {
  note: number;
  /** Read by screen readers, such as "4,9 sur 5". */
  libelle: string;
  taille?: number;
}) {
  const pleines = Math.round(note);
  return (
    <XStack gap={1} aria-label={libelle}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icone
          key={i}
          nom="star_fill"
          taille={taille}
          couleur={i <= pleines ? 'star' : 'border-strong'}
        />
      ))}
    </XStack>
  );
}
