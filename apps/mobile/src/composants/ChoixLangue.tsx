import { type Langue, textes } from '@fixa/core';
import { Icone, type NomIcone, Segments, Texte } from '@fixa/ui';
import { XStack, YStack } from 'tamagui';
import { useLangue } from '../lib/langue';
import { type Theme, useApparence } from '../lib/theme';
import { vibrer } from '../lib/vibrer';

// Each language is written in itself, so anyone can find their own.
const LANGUES: { valeur: Langue; libelle: string }[] = [
  { valeur: 'fr', libelle: 'Français' },
  { valeur: 'en', libelle: 'English' },
  { valeur: 'ar', libelle: 'العربية' },
];

function Reglage({ icone, titre }: { icone: NomIcone; titre: string }) {
  return (
    <XStack gap="3" alignItems="center">
      <XStack
        width={34}
        height={34}
        borderRadius={12}
        backgroundColor="accent-soft"
        alignItems="center"
        justifyContent="center"
      >
        <Icone nom={icone} taille={19} couleur="on-primary-soft" />
      </XStack>
      <Texte flex={1} fontSize={15} fontWeight="500">
        {titre}
      </Texte>
    </XStack>
  );
}

// The preferences section of the profile, signed in or not: language, then light or dark.
export function ChoixLangue() {
  const { langue, changer } = useLangue();
  const { theme, changer: changerTheme } = useApparence();
  const t = textes.auth.profil;
  const themes: { valeur: Theme; libelle: string }[] = [
    { valeur: 'light', libelle: t.clair },
    { valeur: 'dark', libelle: t.sombre },
  ];
  return (
    <YStack gap="2">
      <Texte fontSize="3" fontWeight="500" color="color-muted" paddingStart={4}>
        {t.preferences}
      </Texte>
      <YStack borderRadius="5" backgroundColor="surface" padding="4" gap="3">
        <Reglage icone="language" titre={t.langue} />
        <Segments
          options={LANGUES}
          valeur={langue}
          onChange={(l) => {
            vibrer.selection();
            changer(l);
          }}
        />
        <YStack height={1} backgroundColor="border-color" marginVertical="1" />
        <Reglage icone="dark_mode" titre={t.apparence} />
        <Segments
          options={themes}
          valeur={theme}
          onChange={(v) => {
            vibrer.selection();
            changerTheme(v);
          }}
        />
      </YStack>
    </YStack>
  );
}
