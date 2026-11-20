import { BlurView } from '@sbaiahmed1/react-native-blur';
import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeName } from 'tamagui';
import { useCouleur } from './Onglet';

const FLOU = 24;

// The Android tab bar, floating over the screens on a blur of what scrolls under it.
export function BarreOnglets({
  children,
  onHauteur,
  style,
  ...props
}: ViewProps & { children: ReactNode; onHauteur: (hauteur: number) => void }) {
  const { bottom, left, right } = useSafeAreaInsets();
  const sombre = useThemeName().startsWith('dark');
  const bordure = useCouleur('border-color');
  return (
    <BlurView
      {...props}
      role="tablist"
      blurType={sombre ? 'dark' : 'light'}
      blurAmount={FLOU}
      // TabList hands down a space-between row, the bar sets its own layout after it.
      style={[
        style,
        {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingTop: 10,
          paddingBottom: Math.max(bottom, 10),
          paddingLeft: left,
          paddingRight: right,
          borderTopWidth: 1,
          borderTopColor: bordure,
        },
      ]}
      onLayout={(e) => onHauteur(e.nativeEvent.layout.height)}
    >
      {children}
    </BlurView>
  );
}
