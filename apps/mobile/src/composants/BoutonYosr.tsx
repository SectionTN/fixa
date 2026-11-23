import { textes } from '@fixa/core';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack } from 'tamagui';
import { vibrer } from '../lib/vibrer';
import { Appui } from './Mouvement';
import { HauteurOngletsContexte, useCouleur } from './Onglet';
import { VisageYosr } from './VisageYosr';

const TAILLE = 60;

// The floating Yosr button: two soft rings on arrival, then it stays still.
export function BoutonYosr() {
  const router = useRouter();
  const barre = useContext(HauteurOngletsContexte);
  const { bottom } = useSafeAreaInsets();
  const primaire = useCouleur('primary');
  // The design puts it 16 pt above the tab bar. The iOS system bar is already in the tab's safe area.
  const bas = (barre === 'systeme' ? bottom : (barre ?? bottom)) + 16;
  return (
    // A flattened parent leaves an Android ViewGroup that clips the shadow and rings to the button.
    <View collapsable={false} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        entering={FadeIn.duration(300).delay(250)}
        style={{ position: 'absolute', end: 16, bottom: bas }}
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
            boxShadow="0 10px 24px rgba(92, 52, 30, 0.28)"
          >
            <VisageYosr taille={TAILLE} fond="primary" encre="on-primary" />
          </XStack>
        </Appui>
      </Animated.View>
    </View>
  );
}
