import { isWeb, XStack } from 'tamagui';
import { Texte } from './Texte';

export type EtatCreneau = 'libre' | 'choisi' | 'pris';

export type PuceCreneauProps = {
  heure: string;
  etat: EtatCreneau;
  /** Width from the screen, so four chips fill a row. */
  largeur: number;
  /** Added for screen readers on a taken slot, such as "déjà pris". */
  libellePris: string;
  onPress: () => void;
};

const FOND = {
  libre: 'surface press:background-press',
  choisi: 'primary',
  pris: 'background-soft',
} as const;
const TEXTE = { libre: 'color', choisi: 'on-primary', pris: 'color-subtle' } as const;

// A time slot: free, selected, or taken and struck through.
export function PuceCreneau({ heure, etat, largeur, libellePris, onPress }: PuceCreneauProps) {
  const pris = etat === 'pris';
  return (
    <XStack
      role="button"
      accessible={isWeb ? undefined : true}
      aria-label={pris ? `${heure}, ${libellePris}` : heure}
      aria-selected={etat === 'choisi'}
      aria-disabled={pris}
      width={largeur}
      height={44}
      borderRadius="round"
      borderWidth={etat === 'libre' ? 1.5 : 0}
      borderColor="border-strong"
      backgroundColor={FOND[etat]}
      alignItems="center"
      justifyContent="center"
      onPress={pris ? undefined : onPress}
    >
      <Texte
        fontSize="5"
        fontWeight={etat === 'choisi' ? '600' : '500'}
        color={TEXTE[etat]}
        textDecorationLine={pris ? 'line-through' : 'none'}
      >
        {heure}
      </Texte>
    </XStack>
  );
}
