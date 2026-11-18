import { XStack, YStack } from 'tamagui';
import { Icone } from './Icone';
import { ICONES, type NomIcone } from './icones.generated';
import { Texte } from './Texte';

export type TuileCategorieProps = {
  nom: string;
  /** A Material Symbols name from the categories table, unknown names fall back to a grid. */
  icone: string;
  /** Theme key such as 'cat1', its soft pair is `${couleur}-soft`. */
  couleur: string;
  /** The dashed "Tout voir" tile. */
  toutVoir?: boolean;
  onPress: () => void;
};

const estIcone = (nom: string): nom is NomIcone => nom in ICONES;

export function TuileCategorie({ nom, icone, couleur, toutVoir, onPress }: TuileCategorieProps) {
  return (
    <YStack
      role="button"
      aria-label={nom}
      flex={1}
      alignItems="center"
      gap="2"
      borderRadius="4"
      backgroundColor="transparent press:background-soft"
      onPress={onPress}
    >
      <XStack
        width={64}
        height={64}
        borderRadius={22}
        alignItems="center"
        justifyContent="center"
        backgroundColor={toutVoir ? 'background-soft' : `${couleur}-soft`}
        borderWidth={toutVoir ? 1.5 : 0}
        borderStyle="dashed"
        borderColor="border-strong"
      >
        <Icone
          nom={toutVoir ? 'grid_view' : estIcone(icone) ? icone : 'grid_view'}
          taille={toutVoir ? 28 : 30}
          couleur={toutVoir ? 'color-muted' : couleur}
        />
      </XStack>
      <Texte fontSize="2" fontWeight="500" textAlign="center" numberOfLines={1}>
        {nom}
      </Texte>
    </YStack>
  );
}
