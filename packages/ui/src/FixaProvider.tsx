import type { ReactNode } from 'react';
import { TamaguiProvider } from 'tamagui';
import { config } from './tamagui.config';

export function FixaProvider({
  children,
  theme = 'light',
}: {
  children: ReactNode;
  theme?: 'light' | 'dark';
}) {
  return (
    <TamaguiProvider config={config} defaultTheme={theme}>
      {children}
    </TamaguiProvider>
  );
}
