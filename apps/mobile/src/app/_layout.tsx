import {
  ReadexPro_300Light,
  ReadexPro_400Regular,
  ReadexPro_500Medium,
  ReadexPro_600SemiBold,
  useFonts,
} from '@expo-google-fonts/readex-pro';
import { FixaProvider } from '@fixa/ui';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [policesChargees] = useFonts({
    ReadexPro_300Light,
    ReadexPro_400Regular,
    ReadexPro_500Medium,
    ReadexPro_600SemiBold,
  });

  useEffect(() => {
    if (policesChargees) SplashScreen.hideAsync();
  }, [policesChargees]);

  if (!policesChargees) return null;

  return (
    <FixaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </FixaProvider>
  );
}
