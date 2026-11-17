import type { ReactNode } from 'react';
import { styled, Theme, XStack } from 'tamagui';
import { Icone } from './Icone';
import type { NomIcone } from './icones.generated';
import { Texte } from './Texte';

export type VarianteBouton = 'primary' | 'soft' | 'outline' | 'ghost' | 'danger';
export type TailleBouton = 'sm' | 'md' | 'lg';

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
      sm: { height: '3', paddingHorizontal: '4' },
      md: { height: '4', paddingHorizontal: '5' },
      lg: { height: '5', paddingHorizontal: '6' },
    },
    contour: {
      true: {
        borderWidth: 1,
        borderColor: 'border-strong',
        backgroundColor: 'transparent press:background-press',
      },
    },
    transparent: {
      true: { backgroundColor: 'transparent press:background-press' },
    },
    desactive: {
      true: { opacity: 0.5 },
    },
  } as const,
  defaultVariants: { taille: 'md' },
});

export type BoutonProps = {
  children: ReactNode;
  variante?: VarianteBouton;
  taille?: TailleBouton;
  icone?: NomIcone;
  desactive?: boolean;
  onPress?: () => void;
};

export function Bouton({
  children,
  variante = 'primary',
  taille = 'md',
  icone,
  desactive = false,
  onPress,
}: BoutonProps) {
  const couleurTexte = variante === 'ghost' ? 'primary' : 'color';
  const contenu = (
    <Cadre
      taille={taille}
      contour={variante === 'outline'}
      transparent={variante === 'ghost'}
      desactive={desactive}
      aria-disabled={desactive}
      onPress={desactive ? undefined : onPress}
    >
      {icone ? (
        <Icone nom={icone} taille={taille === 'sm' ? 18 : 20} couleur={couleurTexte} />
      ) : null}
      <Texte color={couleurTexte} fontWeight="600" fontSize={taille === 'sm' ? '4' : '5'}>
        {children}
      </Texte>
    </Cadre>
  );
  return variante === 'outline' || variante === 'ghost' ? (
    contenu
  ) : (
    <Theme name={variante}>{contenu}</Theme>
  );
}
