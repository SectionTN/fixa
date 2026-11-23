import { isWeb, XStack } from 'tamagui';
import { Icone } from './Icone';
import type { NomIcone } from './icones.generated';
import { Texte } from './Texte';

export type EtatPuce = 'repos' | 'choisi' | 'primaire' | 'contour';

export type PuceProps = {
  libelle: string;
  etat?: EtatPuce;
  icone?: NomIcone;
  /** Adds the trailing arrow of a chip that opens a choice. */
  deroulant?: boolean;
  onPress?: () => void;
};

const HAUTEUR = 36;
const MARGE_TACTILE = (44 - HAUTEUR) / 2;

const FOND = {
  repos: 'surface press:background-press',
  choisi: 'primary-soft press:background-press',
  primaire: 'primary press:primary',
  contour: 'surface press:primary-soft',
} as const;
const TEXTE = {
  repos: 'color',
  choisi: 'on-primary-soft',
  primaire: 'on-primary',
  contour: 'primary',
} as const;
const BORD = {
  repos: 'border-strong',
  choisi: 'primary',
  primaire: 'transparent',
  contour: 'primary',
} as const;

// A chip: idle, selected, the primary chip that opens the filters, or an outlined quick reply.
export function Puce({ libelle, etat = 'repos', icone, deroulant, onPress }: PuceProps) {
  const couleur = TEXTE[etat];
  return (
    <XStack
      render="button"
      role="button"
      aria-label={libelle}
      // aria-pressed for a web button, aria-selected on native, which has no aria-pressed.
      aria-pressed={isWeb ? etat === 'choisi' : undefined}
      aria-selected={isWeb ? undefined : etat === 'choisi'}
      height={HAUTEUR}
      borderRadius="round"
      borderWidth={etat === 'primaire' ? 0 : etat === 'contour' ? 1.5 : 1}
      borderColor={BORD[etat]}
      backgroundColor={FOND[etat]}
      paddingStart={icone ? 10 : 14}
      paddingEnd={deroulant ? 10 : 14}
      gap={5}
      alignItems="center"
      hitSlop={{ top: MARGE_TACTILE, bottom: MARGE_TACTILE }}
      onPress={onPress}
    >
      {icone ? (
        <Icone nom={icone} taille={17} couleur={icone === 'star_fill' ? 'star' : couleur} />
      ) : null}
      <Texte fontSize="3" fontWeight="500" color={couleur} numberOfLines={1}>
        {libelle}
      </Texte>
      {deroulant ? <Icone nom="keyboard_arrow_down" taille={18} couleur={couleur} /> : null}
    </XStack>
  );
}
