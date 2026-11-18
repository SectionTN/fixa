import { XStack, YStack } from 'tamagui';
import { Bouton } from './Bouton';
import { Icone } from './Icone';
import type { NomIcone } from './icones.generated';
import { Texte } from './Texte';

export type EtatVideProps = {
  icone: NomIcone;
  titre: string;
  texte: string;
  action?: { libelle: string; onPress: () => void };
  secondaire?: { libelle: string; onPress: () => void };
};

export function EtatVide({ icone, titre, texte, action, secondaire }: EtatVideProps) {
  return (
    <YStack alignItems="center" gap={10} paddingVertical="4" paddingHorizontal="2">
      <XStack
        width={96}
        height={96}
        borderRadius="round"
        backgroundColor="primary-soft"
        alignItems="center"
        justifyContent="center"
        marginBottom={6}
      >
        <Icone nom={icone} taille={44} couleur="primary" />
      </XStack>
      <Texte fontSize="6" fontWeight="600" textAlign="center">
        {titre}
      </Texte>
      <Texte fontSize="4" lineHeight="20px" color="color-muted" textAlign="center" maxWidth={260}>
        {texte}
      </Texte>
      {action ? (
        <YStack marginTop={6}>
          <Bouton onPress={action.onPress}>{action.libelle}</Bouton>
        </YStack>
      ) : null}
      {secondaire ? (
        <Bouton variante="ghost" onPress={secondaire.onPress}>
          {secondaire.libelle}
        </Bouton>
      ) : null}
    </YStack>
  );
}
