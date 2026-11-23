import { textes } from '@fixa/core';
import { Icone } from '@fixa/ui';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack } from 'tamagui';
import { vibrer } from '../lib/vibrer';
import { Appui } from './Mouvement';
import { HauteurOngletsContexte, useCouleur } from './Onglet';

const TAILLE = 60;
// The iOS system tab bar floats over the screen, so the button clears its height too.
const BARRE_SYSTEME = 62;

// The floating Yosr button: two soft rings on arrival, then it stays still.
export function BoutonYosr() {
  const router = useRouter();
  const barre = useContext(HauteurOngletsContexte);
  const { bottom } = useSafeAreaInsets();
  const primaire = useCouleur('primary');
  const bas = (barre === 'systeme' ? bottom + BARRE_SYSTEME : (barre ?? bottom)) + 16;
  return (
    <Animated.View
      entering={FadeIn.duration(300).delay(250)}
      style={{ position: 'absolute', end: 20, bottom: bas }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: TAILLE,
          height: TAILLE,
          borderRadius: TAILLE / 2,
          backgroundColor: primaire,
          animationName: {
            from: { opacity: 0.35, transform: [{ scale: 1 }] },
            to: { opacity: 0, transform: [{ scale: 1.7 }] },
          },
          animationDuration: 1400,
          animationDelay: 600,
          animationIterationCount: 2,
          animationTimingFunction: 'ease-out',
          opacity: 0,
        }}
      />
      <Appui
        accessibilityRole="button"
        accessibilityLabel={textes.yosr.ouvrir}
        onPress={() => {
          vibrer.leger();
          router.push('/yosr');
        }}
      >
        <XStack
          width={TAILLE}
          height={TAILLE}
          borderRadius="round"
          backgroundColor="primary"
          alignItems="center"
          justifyContent="center"
          boxShadow="0 6px 16px rgba(120, 50, 20, 0.28)"
        >
          <Icone nom="mood" taille={34} couleur="on-primary" />
        </XStack>
      </Appui>
    </Animated.View>
  );
}
