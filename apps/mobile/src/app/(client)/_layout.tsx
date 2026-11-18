import { Icone, type NomIcone, Texte } from '@fixa/ui';
import { TabList, TabSlot, Tabs, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, YStack } from 'tamagui';

type OngletProps = TabTriggerSlotProps & {
  icone: NomIcone;
  iconeActive: NomIcone;
  libelle: string;
};

function Onglet({ isFocused, onPress, icone, iconeActive, libelle }: OngletProps) {
  const couleur = isFocused ? 'primary' : 'color-muted';
  return (
    <YStack
      role="tab"
      aria-selected={isFocused}
      aria-label={libelle}
      width={72}
      alignItems="center"
      gap={3}
      onPress={onPress ?? undefined}
    >
      <Icone nom={isFocused ? iconeActive : icone} taille={25} couleur={couleur} />
      <Texte fontSize="1" fontWeight={isFocused ? '600' : '500'} color={couleur}>
        {libelle}
      </Texte>
    </YStack>
  );
}

// The client tab bar: Favoris waits until favourites exist.
export default function ClientLayout() {
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme() as Record<string, { get: () => unknown } | undefined>;
  const couleur = (cle: string) => String(theme[cle]?.get() ?? 'transparent');
  return (
    <Tabs>
      <TabSlot />
      {/* Tabs and TabList read their direct children to find the routes, so the bar is styled in place. */}
      <TabList
        style={{
          justifyContent: 'space-around',
          backgroundColor: couleur('surface'),
          borderTopWidth: 1,
          borderTopColor: couleur('border-color'),
          paddingTop: 10,
          paddingBottom: Math.max(bottom, 10),
        }}
      >
        <TabTrigger name="index" href="/" asChild>
          <Onglet icone="home" iconeActive="home_fill" libelle="Accueil" />
        </TabTrigger>
        <TabTrigger name="rendez-vous" href="/rendez-vous" asChild>
          <Onglet icone="calendar_month" iconeActive="calendar_month_fill" libelle="Mes RDV" />
        </TabTrigger>
        <TabTrigger name="profil" href="/profil" asChild>
          <Onglet icone="person" iconeActive="person_fill" libelle="Profil" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}
