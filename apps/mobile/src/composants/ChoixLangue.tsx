import { type Langue, textes } from '@fixa/core';
import { Icone, Segments, Texte } from '@fixa/ui';
import { XStack, YStack } from 'tamagui';
import { useLangue } from '../lib/langue';
import { vibrer } from '../lib/vibrer';

// Each language is written in itself, so anyone can find their own.
const LANGUES: { valeur: Langue; libelle: string }[] = [
  { valeur: 'fr', libelle: 'Français' },
  { valeur: 'en', libelle: 'English' },
  { valeur: 'ar', libelle: 'العربية' },
];

// The preferences section of the profile, signed in or not.
export function ChoixLangue() {
  const { langue, changer } = useLangue();
  return (
    <YStack gap="2">
      <Texte fontSize="3" fontWeight="500" color="color-muted" paddingStart={4}>
        {textes.auth.profil.preferences}
      </Texte>
      <YStack borderRadius="5" backgroundColor="surface" padding="4" gap="3">
        <XStack gap="3" alignItems="center">
          <XStack
            width={34}
            height={34}
            borderRadius={12}
            backgroundColor="accent-soft"
            alignItems="center"
            justifyContent="center"
          >
            <Icone nom="language" taille={19} couleur="on-primary-soft" />
          </XStack>
          <Texte flex={1} fontSize={15} fontWeight="500">
            {textes.auth.profil.langue}
          </Texte>
        </XStack>
        <Segments
          options={LANGUES}
          valeur={langue}
          onChange={(l) => {
            vibrer.selection();
            changer(l);
          }}
        />
      </YStack>
    </YStack>
  );
}
