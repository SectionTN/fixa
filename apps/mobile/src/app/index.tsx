import { Bouton, Texte } from '@fixa/ui';
import { YStack } from 'tamagui';

export default function Accueil() {
  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      gap="5"
      backgroundColor="background"
    >
      <Texte fontSize="10" fontWeight="600" color="color">
        fixa
      </Texte>
      <Bouton icone="search" onPress={() => console.log('ok')}>
        Trouver un pro
      </Bouton>
    </YStack>
  );
}
