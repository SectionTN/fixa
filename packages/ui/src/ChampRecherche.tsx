import { Input } from '@tamagui/input';
import type { ReactNode } from 'react';
import { XStack } from 'tamagui';
import { Icone } from './Icone';

export type ChampRechercheProps = {
  valeur: string;
  onChange: (valeur: string) => void;
  /** Gets the text from the submit event, which can be ahead of the last onChange. */
  onValider?: (texte: string) => void;
  indice: string;
  /** The floating home bar, or the bordered field above a list. */
  variante: 'flottant' | 'bordure';
  /** A trailing control such as the filters button. */
  fin?: ReactNode;
};

export function ChampRecherche({
  valeur,
  onChange,
  onValider,
  indice,
  variante,
  fin,
}: ChampRechercheProps) {
  const flottant = variante === 'flottant';
  return (
    <XStack
      height={flottant ? 54 : 48}
      borderRadius="round"
      backgroundColor="surface"
      paddingStart={flottant ? 18 : 16}
      paddingEnd={flottant ? 7 : 16}
      gap={10}
      alignItems="center"
      borderWidth={flottant ? 0 : 1}
      borderColor="border-color"
      shadowColor="shadow-color"
      shadowOffset={{ width: 0, height: flottant ? 6 : 0 }}
      shadowRadius={flottant ? 16 : 0}
    >
      <Icone nom="search" taille={flottant ? 22 : 21} couleur="color-muted" />
      <Input
        flex={1}
        minWidth={0}
        height="100%"
        padding={0}
        borderWidth={0}
        outlineWidth={0}
        backgroundColor="transparent"
        fontFamily="body"
        fontSize={15}
        color="color"
        placeholderTextColor="color-subtle"
        placeholder={indice}
        aria-label={indice}
        value={valeur}
        onChangeText={onChange}
        onSubmitEditing={(e) => onValider?.(e.nativeEvent.text)}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {fin}
    </XStack>
  );
}
