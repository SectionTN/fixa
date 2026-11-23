import type { ReactNode } from 'react';
import Animated from 'react-native-reanimated';
import { type GetProps, XStack, YStack } from 'tamagui';

const PULSATION = {
  '0%': { opacity: 1 },
  '50%': { opacity: 0.45 },
  '100%': { opacity: 1 },
};

// One slow opacity pulse for the whole placeholder, so every shape breathes together.
function Pulsation({ children }: { children: ReactNode }) {
  return (
    <Animated.View
      accessibilityRole="progressbar"
      style={{
        animationName: PULSATION,
        animationDuration: 1400,
        animationIterationCount: 'infinite',
        animationTimingFunction: 'ease-in-out',
      }}
    >
      {children}
    </Animated.View>
  );
}

function Bloc(props: GetProps<typeof YStack>) {
  return <YStack backgroundColor="background-press" borderRadius={8} {...props} />;
}

// The home screen while categories and the top pros load: the same grid and cards, in gray.
export function SqueletteAccueil() {
  return (
    <Pulsation>
      <YStack gap="5">
        <YStack gap={14}>
          <Bloc width={120} height={18} />
          {[0, 1].map((ligne) => (
            <XStack key={ligne} gap="2">
              {[0, 1, 2, 3].map((i) => (
                <YStack key={i} flex={1} alignItems="center" gap="2">
                  <Bloc width={64} height={64} borderRadius={22} />
                  <Bloc width={48} height={10} />
                </YStack>
              ))}
            </XStack>
          ))}
        </YStack>
        <YStack gap={14}>
          <Bloc width={140} height={18} />
          <XStack gap={12} marginEnd={-20} overflow="hidden">
            {[0, 1].map((i) => (
              <YStack
                key={i}
                width={236}
                borderRadius="5"
                backgroundColor="surface"
                overflow="hidden"
              >
                <Bloc height={124} borderRadius={0} />
                <YStack padding={14} gap={10}>
                  <Bloc width={150} height={14} />
                  <Bloc width={110} height={10} />
                  <Bloc width={80} height={10} />
                </YStack>
              </YStack>
            ))}
          </XStack>
        </YStack>
      </YStack>
    </Pulsation>
  );
}

// The result list while the pros load: four row cards in gray.
export function SqueletteResultats() {
  return (
    <Pulsation>
      <YStack gap={14}>
        <Bloc width={90} height={12} />
        {[0, 1, 2, 3].map((i) => (
          <XStack key={i} gap={14} padding={14} borderRadius="5" backgroundColor="surface">
            <Bloc width={64} height={64} borderRadius={20} />
            <YStack flex={1} gap={10} paddingTop={4}>
              <Bloc width="60%" height={14} />
              <Bloc width="85%" height={10} />
              <Bloc width="40%" height={10} />
            </YStack>
          </XStack>
        ))}
      </YStack>
    </Pulsation>
  );
}
