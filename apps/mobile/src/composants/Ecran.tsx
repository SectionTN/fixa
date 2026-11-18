import { fr } from '@fixa/core';
import { Icone } from '@fixa/ui';
import type { ReactNode } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { XStack, YStack, type YStackProps } from 'tamagui';

const ESPACE_AU_DESSUS_DU_CLAVIER = 24;

// A scrolling screen under the status bar that keeps the focused field above the keyboard.
export function Ecran({ children, ...corps }: { children: ReactNode } & YStackProps) {
  return (
    <YStack flex={1} backgroundColor="background">
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <KeyboardAwareScrollView
          bottomOffset={ESPACE_AU_DESSUS_DU_CLAVIER}
          contentContainerStyle={{ flexGrow: 1 }}
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

export function BoutonRetour({ onPress }: { onPress: () => void }) {
  return (
    <XStack
      role="button"
      aria-label={fr.commun.retour}
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
      <Icone nom="arrow_back" taille={22} />
    </XStack>
  );
}
