import { Icone, type NomIcone, Texte } from '@fixa/ui';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, XStack, YStack } from 'tamagui';

export type OngletProps = TabTriggerSlotProps & {
  icone: NomIcone;
  iconeActive: NomIcone;
  libelle: string;
  /** A count shown on the icon, such as pending requests. */
  pastille?: number;
};

export function Onglet({ isFocused, onPress, icone, iconeActive, libelle, pastille }: OngletProps) {
  const couleur = isFocused ? 'primary' : 'color-muted';
  return (
    <YStack
      role="tab"
      aria-selected={isFocused}
      aria-label={pastille ? `${libelle}, ${pastille}` : libelle}
      width={72}
      minHeight={44}
      justifyContent="center"
      alignItems="center"
      gap={3}
      onPress={onPress ?? undefined}
    >
      <YStack>
        <Icone nom={isFocused ? iconeActive : icone} taille={25} couleur={couleur} />
        {pastille ? (
          <XStack
            position="absolute"
            top={-6}
            end={-12}
            minWidth={20}
            height={20}
            paddingHorizontal={5}
            borderRadius="round"
            borderWidth={2}
            borderColor="surface"
            backgroundColor="primary"
            alignItems="center"
            justifyContent="center"
          >
            <Texte fontSize={11} fontWeight="600" color="on-primary">
              {pastille}
            </Texte>
          </XStack>
        ) : null}
      </YStack>
      <Texte fontSize="1" fontWeight={isFocused ? '600' : '500'} color={couleur}>
        {libelle}
      </Texte>
    </YStack>
  );
}

// The style both tab bars share, as TabList takes a plain style object.
export function useStyleBarre() {
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme() as Record<string, { get: () => unknown } | undefined>;
  const couleur = (cle: string) => String(theme[cle]?.get() ?? 'transparent');
  return {
    justifyContent: 'space-around' as const,
    backgroundColor: couleur('surface'),
    borderTopWidth: 1,
    borderTopColor: couleur('border-color'),
    paddingTop: 10,
    paddingBottom: Math.max(bottom, 10),
  };
}
