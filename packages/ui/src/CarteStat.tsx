import { XStack, YStack } from 'tamagui';
import { Icone } from './Icone';
import type { NomIcone } from './icones.generated';
import { Texte } from './Texte';

export type CarteStatProps = {
  icone: NomIcone;
  /** Theme keys of the icon tile, such as 'secondary-soft' and 'secondary'. */
  fond: string;
  teinte: string;
  libelle: string;
  valeur: string;
};

// The dashboard stat card. The month-over-month pill waits until a previous month exists to compare with.
export function CarteStat({ icone, fond, teinte, libelle, valeur }: CarteStatProps) {
  return (
    <YStack
      flex={1}
      padding="5"
      gap="3"
      borderRadius="5"
      backgroundColor="surface"
      shadowColor="shadow-color"
      shadowOffset={{ width: 0, height: 1 }}
      shadowRadius={3}
    >
      <XStack gap={10} alignItems="center">
        <XStack
          width={36}
          height={36}
          borderRadius={12}
          backgroundColor={fond}
          alignItems="center"
          justifyContent="center"
        >
          <Icone nom={icone} taille={20} couleur={teinte} />
        </XStack>
        <Texte fontSize="4" color="color-muted">
          {libelle}
        </Texte>
      </XStack>
      <Texte fontSize={30} lineHeight="36px" fontWeight="600">
        {valeur}
      </Texte>
    </YStack>
  );
}
