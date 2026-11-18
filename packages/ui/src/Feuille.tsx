import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { Sheet, XStack, YStack } from 'tamagui';

export type FeuilleProps = {
  ouverte: boolean;
  onFermer: () => void;
  /** Share of the screen height the sheet takes, in percent. */
  hauteur?: number;
  children: ReactNode;
  /** Pinned under the scrolling content, such as the confirm button. */
  pied?: ReactNode;
  /** The bottom safe-area inset, added under the footer. */
  margeBas?: number;
};

// A bottom sheet rendered in place, so the screen's contexts reach its content.
export function Feuille({
  ouverte,
  onFermer,
  hauteur = 85,
  children,
  pied,
  margeBas = 0,
}: FeuilleProps) {
  // In place, Android back would pop the screen under the sheet.
  useEffect(() => {
    if (!ouverte) return;
    const abonnement = BackHandler.addEventListener('hardwareBackPress', () => {
      onFermer();
      return true;
    });
    return () => abonnement.remove();
  }, [ouverte, onFermer]);

  return (
    <Sheet
      modal={false}
      open={ouverte}
      onOpenChange={(o: boolean) => {
        if (!o) onFermer();
      }}
      snapPoints={[hauteur]}
      snapPointsMode="percent"
      dismissOnSnapToBottom
      transition="feuille"
    >
      <Sheet.Overlay backgroundColor="overlay" />
      <Sheet.Container>
        <Sheet.Background
          backgroundColor="surface"
          borderTopStartRadius={32}
          borderTopEndRadius={32}
        />
        <XStack justifyContent="center" paddingTop={10} paddingBottom={18}>
          <YStack width={40} height={5} borderRadius="round" backgroundColor="border-strong" />
        </XStack>
        {/* 12 lands the content at the design's 20, measured on iOS and Android. */}
        <Sheet.ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}>
          {children}
        </Sheet.ScrollView>
        {pied ? (
          <XStack
            paddingTop={14}
            paddingHorizontal={20}
            paddingBottom={Math.max(margeBas, 14) + 8}
            borderTopWidth={1}
            borderColor="border-color"
            backgroundColor="surface"
          >
            {pied}
          </XStack>
        ) : null}
      </Sheet.Container>
    </Sheet>
  );
}
