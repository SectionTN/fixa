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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Bandeau } from '../composants/Bandeau';
import { useRendezVousEnDirect } from '../lib/enDirect';
import { chargerLangue, LangueProvider, useLangue } from '../lib/langue';
import { SessionProvider, useSession } from '../lib/session';
import { ThemeProvider } from '../lib/theme';

SplashScreen.preventAutoHideAsync();
chargerLangue();

// Each group opens only for its state, so a role change or a sign-out moves the user without a manual redirect.
function Navigation({ policesPretes }: { policesPretes: boolean }) {
  const { utilisateur, role, chargement } = useSession();
  const { langue } = useLangue();
  const pret = policesPretes && !chargement;
  useRendezVousEnDirect(
    utilisateur && (role === 'client' || role === 'fournisseur') ? utilisateur.id : null,
  );

  useEffect(() => {
    if (pret) SplashScreen.hideAsync();
  }, [pret]);

  if (!pret) return null;
  const connecte = utilisateur !== null;
  // Where a closed route sends the user, since the root stack has no screen at / for every state.
  const accueil = !connecte
    ? '/'
    : role === null
      ? '/role'
      : role === 'fournisseur'
        ? '/demandes'
        : role === 'admin'
          ? '/admin'
          : '/';
  // Visitors browse the client tabs, so that group comes first and is the start screen.
  // A new language remounts the screens, so every string is read again.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack key={langue} screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!connecte || role === 'client'} redirectTo={accueil}>
          <Stack.Screen name="(client)" />
          <Stack.Screen name="categorie/[id]" />
          <Stack.Screen name="pro/[id]" />
          <Stack.Screen name="yosr" options={{ presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Protected guard={connecte && role === 'client'} redirectTo={accueil}>
          <Stack.Screen name="reserver/[fournisseurId]" />
          <Stack.Screen name="notifications" />
          <Stack.Screen
            name="rendez-vous/[id]/annuler"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: 'fitToContents',
              sheetGrabberVisible: true,
              sheetCornerRadius: 32,
            }}
          />
          <Stack.Screen
            name="rendez-vous/[id]/avis"
            options={{ presentation: 'fullScreenModal' }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!connecte} redirectTo={accueil}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={connecte && role === null} redirectTo={accueil}>
          <Stack.Screen name="role" />
        </Stack.Protected>
        <Stack.Protected guard={role === 'fournisseur'} redirectTo={accueil}>
          <Stack.Screen name="(fournisseur)" />
          <Stack.Screen name="demande/[id]" />
        </Stack.Protected>
        <Stack.Protected guard={role === 'admin'} redirectTo={accueil}>
          <Stack.Screen name="admin" />
        </Stack.Protected>
      </Stack>
      <Bandeau />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  // A font that fails to load falls back to the system font instead of holding the splash.
  const [policesChargees, erreurPolices] = useFonts({
    ReadexPro_300Light,
    ReadexPro_400Regular,
    ReadexPro_500Medium,
    ReadexPro_600SemiBold,
  });

  return (
    <KeyboardProvider>
      <ThemeProvider>
        {(theme) => (
          <FixaProvider theme={theme}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            <SessionProvider>
              <LangueProvider>
                <Navigation policesPretes={policesChargees || erreurPolices !== null} />
              </LangueProvider>
            </SessionProvider>
          </FixaProvider>
        )}
      </ThemeProvider>
    </KeyboardProvider>
  );
}
