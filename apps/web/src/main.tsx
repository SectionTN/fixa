import { Bouton, FixaProvider, Texte } from '@fixa/ui';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { YStack } from 'tamagui';

function Accueil() {
  return (
    <YStack
      flex={1}
      minHeight="100vh"
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

const racine = document.getElementById('root');
if (!racine) throw new Error('#root is missing in index.html');

createRoot(racine).render(
  <StrictMode>
    <FixaProvider>
      <Accueil />
    </FixaProvider>
  </StrictMode>,
);
