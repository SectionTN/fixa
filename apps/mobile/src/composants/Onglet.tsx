import { Icone, type NomIcone, Texte } from '@fixa/ui';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import { createContext, useContext } from 'react';
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

/** The tab bar over the screens: 'systeme' when the system bar adds itself to each tab's safe area, else the JS bar's measured height. */
export const HauteurOngletsContexte = createContext<'systeme' | number | null>(null);

// The space a tab screen leaves under its last row so it scrolls clear of the tab bar, 0 outside the tabs.
export function useBasOnglets(): number {
  const barre = useContext(HauteurOngletsContexte);
  const { bottom } = useSafeAreaInsets();
  if (barre === 'systeme') return bottom;
  return barre ?? 0;
}

// A theme colour as the plain value native props take.
export function useCouleur(cle: string): string {
  const theme = useTheme() as Record<string, { get: () => unknown } | undefined>;
  return String(theme[cle]?.get() ?? 'transparent');
}
