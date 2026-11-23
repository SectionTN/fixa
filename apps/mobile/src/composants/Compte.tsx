import { initiales, textes } from '@fixa/core';
import { Icone, Texte } from '@fixa/ui';
import { XStack, YStack } from 'tamagui';
import { useSession } from '../lib/session';
import { ChoixLangue } from './ChoixLangue';
import { Ecran } from './Ecran';

const t = textes.auth.profil;

// The signed-in account: identity, preferences, then sign-out last.
export function Compte({ titre }: { titre: string }) {
  const { utilisateur, deconnexion } = useSession();
  const nom = utilisateur?.nom ?? '';
  return (
    <Ecran paddingTop="2" paddingHorizontal="5" paddingBottom="6" gap="5">
      <Texte fontSize="9" fontWeight="600" paddingTop="1" paddingHorizontal="1">
        {titre}
      </Texte>
      <XStack padding="4" borderRadius="5" backgroundColor="surface" gap={14} alignItems="center">
        <XStack
          width={64}
          height={64}
          borderRadius="round"
          backgroundColor="accent-soft"
          alignItems="center"
          justifyContent="center"
        >
          <Texte fontSize={22} fontWeight="600" color="on-primary-soft">
            {initiales(nom)}
          </Texte>
        </XStack>
        <YStack flex={1} gap="1">
          <Texte fontSize="6" fontWeight="600">
            {nom}
          </Texte>
          <Texte fontSize="3" color="color-muted">
            {utilisateur?.email}
          </Texte>
        </YStack>
      </XStack>
      <ChoixLangue />
      <YStack borderRadius="5" backgroundColor="surface" paddingHorizontal="4">
        <XStack
          role="button"
          accessible
          height={54}
          gap="3"
          alignItems="center"
          backgroundColor="surface press:background-soft"
          onPress={deconnexion}
        >
          <XStack
            width={34}
            height={34}
            borderRadius={12}
            backgroundColor="cancelled-soft"
            alignItems="center"
            justifyContent="center"
          >
            <Icone nom="logout" taille={19} couleur="cancelled" />
          </XStack>
          <Texte flex={1} fontSize={15} fontWeight="500" color="cancelled">
            {t.deconnexion}
          </Texte>
        </XStack>
      </YStack>
    </Ecran>
  );
}
