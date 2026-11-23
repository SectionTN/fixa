import { estNonLue, notificationsClient, textes } from '@fixa/core';
import { Icone } from '@fixa/ui';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import Animated from 'react-native-reanimated';
import { XStack, YStack } from 'tamagui';
import { useMesRendezVous } from '../lib/mesRendezVous';
import { useLuesJusqua } from '../lib/notifications';
import { vibrer } from '../lib/vibrer';
import { entreePop } from './Mouvement';

// The bell on the home screen, with a dot while a notification is unread.
export function Cloche({ uid }: { uid: string }) {
  const router = useRouter();
  const lecture = useMesRendezVous(uid);
  const luesJusqua = useLuesJusqua(uid);
  const liste = lecture.donnees?.liste;
  const nonLue = useMemo(
    () => (liste ? notificationsClient(liste).some((n) => estNonLue(n, luesJusqua)) : false),
    [liste, luesJusqua],
  );
  return (
    <XStack
      role="button"
      aria-label={textes.notifications.ouvrir}
      width={52}
      height={52}
      borderRadius="round"
      backgroundColor="surface press:background-press"
      alignItems="center"
      justifyContent="center"
      boxShadow="0 4px 14px rgba(92, 52, 30, 0.12)"
      onPress={() => {
        vibrer.leger();
        router.push('/notifications');
      }}
    >
      <Icone nom="notifications" taille={24} couleur="color" />
      {nonLue ? (
        <Animated.View
          entering={entreePop}
          style={{ position: 'absolute', top: 12, end: 13 }}
          pointerEvents="none"
        >
          <YStack
            width={10}
            height={10}
            borderRadius="round"
            backgroundColor="primary"
            borderWidth={2}
            borderColor="surface"
          />
        </Animated.View>
      ) : null}
    </XStack>
  );
}
