import { heureLocale, jourCourtLocal, type RendezVous, textes } from '@fixa/core';
import { Icone, Texte } from '@fixa/ui';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { I18nManager, Pressable } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { ecouterRendezVous } from '../lib/enDirect';
import { useSession } from '../lib/session';
import { vibrer } from '../lib/vibrer';
import { EASE_OUT } from './Mouvement';

const DUREE_MS = 5000;
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

const entree = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -90 }, { scale: 0.96 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }], easing: EASE_OUT },
}).duration(460);

const sortie = new Keyframe({
  0: { opacity: 1, transform: [{ translateY: 0 }] },
  100: { opacity: 0, transform: [{ translateY: -90 }], easing: EASE_IN_OUT },
}).duration(300);

type Annonce = { cle: string; titre: string; detail: string; positive: boolean };

// What a pro did to one of the client's bookings, or null when the client did it.
function annonceDe(rdv: RendezVous): Annonce | null {
  const t = textes.rendezVous.bandeau;
  const detail = `${jourCourtLocal(rdv.debut)} · ${heureLocale(rdv.debut)} · ${rdv.serviceTitre}`;
  const cle = `${rdv.$id}:${rdv.statut}`;
  if (rdv.statut === 'CONFIRME')
    return { cle, titre: t.confirme(rdv.fournisseurNom), detail, positive: true };
  if (rdv.statut === 'REFUSE')
    return { cle, titre: t.refuse(rdv.fournisseurNom), detail, positive: false };
  if (rdv.statut === 'ANNULE' && rdv.annulePar === 'fournisseur')
    return { cle, titre: t.annule(rdv.fournisseurNom), detail, positive: false };
  return null;
}

// A notification-style banner when a pro answers one of the client's bookings, on any screen.
export function Bandeau() {
  const { utilisateur, role } = useSession();
  const chemin = usePathname();
  const haut = useSafeAreaInsets().top;
  const [annonce, setAnnonce] = useState<Annonce | null>(null);
  const vues = useRef(new Set<string>());
  const surMesRdv = useRef(false);
  surMesRdv.current = chemin === '/rendez-vous';
  const clientId = role === 'client' ? (utilisateur?.id ?? null) : null;

  useEffect(() => {
    if (!clientId) {
      setAnnonce(null);
      return;
    }
    return ecouterRendezVous((rdv) => {
      if (rdv.clientId !== clientId) return;
      const a = annonceDe(rdv);
      if (!a || vues.current.has(a.cle)) return;
      vues.current.add(a.cle);
      // On Mes RDV the card's own status change already vibrates.
      if (!surMesRdv.current) (a.positive ? vibrer.succes : vibrer.leger)();
      setAnnonce(a);
    });
  }, [clientId]);

  useEffect(() => {
    if (!annonce) return;
    const minuteur = setTimeout(() => setAnnonce(null), DUREE_MS);
    return () => clearTimeout(minuteur);
  }, [annonce]);

  if (!annonce) return null;
  return (
    <Animated.View
      key={annonce.cle}
      entering={entree}
      exiting={sortie}
      style={{ position: 'absolute', top: haut + 6, left: 12, right: 12, zIndex: 100 }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${annonce.titre}. ${annonce.detail}`}
        onPress={() => {
          setAnnonce(null);
          if (!surMesRdv.current) router.navigate('/rendez-vous');
        }}
      >
        <XStack
          gap="3"
          padding="3"
          borderRadius={22}
          backgroundColor="surface"
          alignItems="center"
          boxShadow="0 10px 28px rgba(20, 20, 40, 0.16)"
        >
          <XStack
            width={42}
            height={42}
            borderRadius="round"
            backgroundColor={annonce.positive ? 'confirmed-soft' : 'cancelled-soft'}
            alignItems="center"
            justifyContent="center"
          >
            <Icone
              nom={annonce.positive ? 'event_available' : 'event_busy'}
              taille={22}
              couleur={annonce.positive ? 'confirmed' : 'cancelled'}
            />
          </XStack>
          <YStack flex={1} gap={2} minWidth={0}>
            <Texte fontSize="4" fontWeight="600" numberOfLines={1}>
              {annonce.titre}
            </Texte>
            <Texte fontSize="3" color="color-muted" numberOfLines={1}>
              {annonce.detail}
            </Texte>
          </YStack>
          <XStack style={{ transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }}>
            <Icone nom="chevron_right" taille={20} couleur="color-muted" />
          </XStack>
        </XStack>
      </Pressable>
    </Animated.View>
  );
}
