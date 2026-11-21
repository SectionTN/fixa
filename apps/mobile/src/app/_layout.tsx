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
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useRendezVousEnDirect } from '../lib/enDirect';
import { SessionProvider, useSession } from '../lib/session';

SplashScreen.preventAutoHideAsync();

// Each group opens only for its state, so a role change or a sign-out moves the user without a manual redirect.
function Navigation({ policesPretes }: { policesPretes: boolean }) {
  const { utilisateur, role, chargement } = useSession();
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
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!connecte || role === 'client'} redirectTo={accueil}>
        <Stack.Screen name="(client)" />
        <Stack.Screen name="categorie/[id]" />
        <Stack.Screen name="pro/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={connecte && role === 'client'} redirectTo={accueil}>
        <Stack.Screen name="reserver/[fournisseurId]" />
        <Stack.Screen
          name="rendez-vous/[id]/annuler"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: 'fitToContents',
            sheetGrabberVisible: true,
            sheetCornerRadius: 32,
          }}
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
      <FixaProvider>
        <StatusBar style="dark" />
        <SessionProvider>
          <Navigation policesPretes={policesChargees || erreurPolices !== null} />
        </SessionProvider>
      </FixaProvider>
    </KeyboardProvider>
  );
}
