import type { ReactNode } from 'react';
import { isWeb, styled, Theme, XStack } from 'tamagui';
import { Icone } from './Icone';
import type { NomIcone } from './icones.generated';
import { Texte } from './Texte';

export type VarianteBouton = 'primary' | 'soft' | 'outline' | 'ghost' | 'danger' | 'destructif';
export type TailleBouton = 'sm' | 'md' | 'lg';

const CIBLE_TACTILE = 44;
const HAUTEUR = { sm: 36, md: 44, lg: 52 } as const;
const TEXTE = { sm: 14, md: 15, lg: 16 } as const;

const Cadre = styled(XStack, {
  role: 'button',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  borderRadius: 'round',
  backgroundColor: 'background press:background-press hover:background-hover',
  cursor: 'pointer',
  variants: {
    taille: {
      sm: { height: HAUTEUR.sm, paddingHorizontal: '4' },
      md: { height: HAUTEUR.md, paddingHorizontal: '5' },
      lg: { height: HAUTEUR.lg, paddingHorizontal: '6' },
    },
    contour: {
      true: {
        borderWidth: 1.5,
        borderColor: 'border-strong',
        backgroundColor: 'transparent press:background-press',
      },
    },
    transparent: {
      true: { backgroundColor: 'transparent press:background-press' },
    },
    desactive: {
      true: { backgroundColor: 'background-press', borderColor: 'transparent', cursor: 'default' },
    },
  } as const,
  defaultVariants: { taille: 'md' },
});

export type BoutonProps = {
  children: ReactNode;
  variante?: VarianteBouton;
  taille?: TailleBouton;
  icone?: NomIcone;
  /** An icon after the label, such as an arrow on a step forward. */
  iconeFin?: NomIcone;
  debut?: ReactNode;
  desactive?: boolean;
  onPress?: () => void;
};

export function Bouton({
  children,
  variante = 'primary',
  taille = 'md',
  icone,
  iconeFin,
  debut,
  desactive = false,
  onPress,
}: BoutonProps) {
  const couleurTexte = desactive ? 'color-subtle' : variante === 'ghost' ? 'primary' : 'color';
  const marge = Math.max(0, (CIBLE_TACTILE - HAUTEUR[taille]) / 2);
  const contenu = (
    <Cadre
      // iOS reads a view with a role as one control only when it is accessible, the DOM has no such attribute.
      accessible={isWeb ? undefined : true}
      taille={taille}
      contour={variante === 'outline'}
      transparent={variante === 'ghost'}
      desactive={desactive}
      aria-disabled={desactive}
      hitSlop={marge > 0 ? { top: marge, bottom: marge } : undefined}
      onPress={desactive ? undefined : onPress}
    >
      {debut}
      {icone ? (
        <Icone nom={icone} taille={taille === 'sm' ? 18 : 20} couleur={couleurTexte} />
      ) : null}
      <Texte color={couleurTexte} fontWeight="500" fontSize={TEXTE[taille]}>
        {children}
      </Texte>
      {iconeFin ? (
        <Icone nom={iconeFin} taille={taille === 'sm' ? 18 : 20} couleur={couleurTexte} />
      ) : null}
    </Cadre>
  );
  return desactive || variante === 'outline' || variante === 'ghost' ? (
    contenu
  ) : (
    <Theme name={variante}>{contenu}</Theme>
  );
}
