import { isWeb, XStack } from 'tamagui';
import { Icone } from './Icone';

export type ChoixNoteProps = {
  note: number;
  onChange: (note: number) => void;
  /** Read by screen readers for each star, such as "4 étoiles". */
  libelle: (note: number) => string;
};

// Five stars to pick a rating, each a 44 pt target read as one choice of the group.
export function ChoixNote({ note, onChange, libelle }: ChoixNoteProps) {
  return (
    <XStack gap={6} role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => (
        <XStack
          key={n}
          role="radio"
          accessible={isWeb ? undefined : true}
          aria-checked={n === note}
          aria-label={libelle(n)}
          width={44}
          height={44}
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          onPress={() => onChange(n)}
        >
          <Icone nom="star_fill" taille={44} couleur={n <= note ? 'star' : 'border-strong'} />
        </XStack>
      ))}
    </XStack>
  );
}
