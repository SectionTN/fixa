import type { ReactNode } from 'react';
import { isWeb, TamaguiProvider, Theme } from 'tamagui';
import { config } from './tamagui.config';

// Theme follows a change at runtime on native. The web admin stays light without a wrapper element.
export function FixaProvider({
  children,
  theme = 'light',
}: {
  children: ReactNode;
  theme?: 'light' | 'dark';
}) {
  return (
    <TamaguiProvider config={config} defaultTheme={theme}>
      {isWeb ? children : <Theme name={theme}>{children}</Theme>}
    </TamaguiProvider>
  );
}
