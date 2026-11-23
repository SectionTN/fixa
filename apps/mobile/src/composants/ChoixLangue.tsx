import { type Langue, textes } from '@fixa/core';
import { Puce, Texte } from '@fixa/ui';
import { XStack, YStack } from 'tamagui';
import { useLangue } from '../lib/langue';

// Each language is written in itself, so anyone can find their own.
const LANGUES: { code: Langue; nom: string }[] = [
  { code: 'fr', nom: 'Français' },
  { code: 'en', nom: 'English' },
  { code: 'ar', nom: 'العربية' },
];

export function ChoixLangue() {
  const { langue, changer } = useLangue();
  return (
    <YStack borderRadius="5" backgroundColor="surface" padding="4" gap="3">
      <Texte fontSize={15} fontWeight="500">
        {textes.auth.profil.langue}
      </Texte>
      <XStack gap="2" flexWrap="wrap">
        {LANGUES.map((l) => (
          <Puce
            key={l.code}
            libelle={l.nom}
            etat={langue === l.code ? 'choisi' : 'repos'}
            onPress={() => changer(l.code)}
          />
        ))}
      </XStack>
    </YStack>
  );
}
