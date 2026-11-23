import { textes } from '@fixa/core';
import { Icone } from '@fixa/ui';
import type { ReactNode } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack, type YStackProps } from 'tamagui';
import { useBasOnglets } from './Onglet';

const ESPACE_AU_DESSUS_DU_CLAVIER = 24;
/** The least space above a screen's content when no status bar sits there, as on the iPhone Duo panels. */
export const MARGE_HAUT_MIN = 20;
export const BORDS_ECRAN = { top: 'maximum', left: 'additive', right: 'additive' } as const;

// The top inset, never less than MARGE_HAUT_MIN, for screens that place content from it in JS.
export function useHaut(): number {
  return Math.max(useSafeAreaInsets().top, MARGE_HAUT_MIN);
}

// A scrolling screen under the status bar that keeps the focused field above the keyboard.
export function Ecran({ children, ...corps }: { children: ReactNode } & YStackProps) {
  const bas = useBasOnglets();
  return (
    <YStack flex={1} backgroundColor="background">
      <SafeAreaView edges={BORDS_ECRAN} style={{ flex: 1, paddingTop: MARGE_HAUT_MIN }}>
        <KeyboardAwareScrollView
          bottomOffset={ESPACE_AU_DESSUS_DU_CLAVIER}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: bas }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <YStack flex={1} {...corps}>
            {children}
          </YStack>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </YStack>
  );
}

// Keeps a screen with pinned bars clear of the side insets, while the background behind it runs edge to edge.
export function CadreLateral({ children }: { children: ReactNode }) {
  return (
    <YStack flex={1} backgroundColor="background">
      <SafeAreaView edges={['left', 'right']} mode="margin" style={{ flex: 1 }}>
        {children}
      </SafeAreaView>
    </YStack>
  );
}

// A back arrow, or a cross with `fermer` on a screen that slides up as a modal.
export function BoutonRetour({
  onPress,
  fermer = false,
}: {
  onPress: () => void;
  fermer?: boolean;
}) {
  return (
    <XStack
      role="button"
      aria-label={fermer ? textes.commun.fermer : textes.commun.retour}
      width={44}
      height={44}
      borderRadius="round"
      borderWidth={1.5}
      borderColor="border-color"
      alignItems="center"
      justifyContent="center"
      backgroundColor="transparent press:background-press"
      onPress={onPress}
    >
      <Icone nom={fermer ? 'close' : 'arrow_back'} taille={22} />
    </XStack>
  );
}
