import { heureLocale, jourCourtLocal, type RendezVous, textes } from '@fixa/core';
import { Icone, type NomIcone, Texte } from '@fixa/ui';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { I18nManager, Pressable } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { XStack, YStack } from 'tamagui';
import { ecouterRendezVous } from '../lib/enDirect';
import { useSession } from '../lib/session';
import { vibrer } from '../lib/vibrer';
import { EASE_OUT } from './Mouvement';

const DUREE_MS = 5000;
// A realtime row older than this is a late write to an old booking, not news.
const FRAICHEUR_MS = 5 * 60_000;
const HORS_ECRAN = -140;
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

const entree = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -90 }, { scale: 0.96 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }], easing: EASE_OUT },
}).duration(460);

type Annonce = {
  cle: string;
  titre: string;
  detail: string;
  icone: NomIcone;
  ton: 'confirmed' | 'cancelled' | 'pending';
  /** Where a tap leads. */
  vers: '/rendez-vous' | '/demandes';
};

// What the other side did to one of the user's bookings, or null when the user did it.
function annonceDe(rdv: RendezVous, uid: string, role: 'client' | 'fournisseur'): Annonce | null {
  const t = textes.rendezVous.bandeau;
  const detail = `${jourCourtLocal(rdv.debut)} · ${heureLocale(rdv.debut)} · ${rdv.serviceTitre}`;
  const cle = `${rdv.$id}:${rdv.statut}`;
  if (role === 'client' && rdv.clientId === uid) {
    const base = { cle, detail, vers: '/rendez-vous' as const };
    const pro = rdv.fournisseurNom;
    if (rdv.statut === 'CONFIRME')
      return { ...base, titre: t.confirme(pro), icone: 'event_available', ton: 'confirmed' };
    if (rdv.statut === 'REFUSE')
      return { ...base, titre: t.refuse(pro), icone: 'event_busy', ton: 'cancelled' };
    if (rdv.statut === 'ANNULE' && rdv.annulePar === 'fournisseur')
      return { ...base, titre: t.annule(pro), icone: 'event_busy', ton: 'cancelled' };
  }
  if (role === 'fournisseur' && rdv.fournisseurId === uid) {
    const base = { cle, detail, vers: '/demandes' as const };
    const client = rdv.clientNom;
    if (rdv.statut === 'EN_ATTENTE' && rdv.estUrgent)
      return { ...base, titre: t.urgente(client), icone: 'bolt', ton: 'pending' };
    if (rdv.statut === 'EN_ATTENTE')
      return { ...base, titre: t.nouvelle(client), icone: 'inbox', ton: 'pending' };
    if (rdv.statut === 'ANNULE' && rdv.annulePar === 'client')
      return { ...base, titre: t.annuleClient(client), icone: 'event_busy', ton: 'cancelled' };
  }
  return null;
}

function estFraiche(rdv: RendezVous): boolean {
  const modifie = (rdv as RendezVous & { $updatedAt?: string }).$updatedAt;
  return !modifie || Date.now() - Date.parse(modifie) < FRAICHEUR_MS;
}

// One banner: it leaves on its own after a while, or with a swipe up like an iOS notification.
function Carte({
  annonce,
  onFermer,
  onOuvrir,
}: {
  annonce: Annonce;
  onFermer: () => void;
  onOuvrir: () => void;
}) {
  const y = useSharedValue(0);
  // The latest close callback, read when the timer fires, so a re-render never restarts it.
  const fermerRef = useRef(onFermer);
  fermerRef.current = onFermer;

  useEffect(() => {
    const minuteur = setTimeout(() => {
      const fermer = fermerRef.current;
      y.set(
        withTiming(HORS_ECRAN, { duration: 280, easing: EASE_IN_OUT }, (fini) => {
          if (fini) scheduleOnRN(fermer);
        }),
      );
    }, DUREE_MS);
    return () => clearTimeout(minuteur);
  }, [y]);

  const glisser = usePanGesture({
    onUpdate: (e) => {
      // Up follows the finger, down resists, so it never leaves the top edge.
      y.set(e.translationY < 0 ? e.translationY : e.translationY / 6);
    },
    onDeactivate: (e) => {
      if (e.translationY < -36 || e.velocityY < -500) {
        y.set(
          withTiming(HORS_ECRAN, { duration: 220, easing: EASE_OUT }, (fini) => {
            if (fini) scheduleOnRN(onFermer);
          }),
        );
      } else {
        y.set(withSpring(0, { duration: 400, dampingRatio: 0.8 }));
      }
    },
  });

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(y.get(), [HORS_ECRAN, 0], [0, 1], 'clamp'),
    transform: [{ translateY: y.get() }],
  }));

  return (
    <GestureDetector gesture={glisser}>
      <Animated.View style={style}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${annonce.titre}. ${annonce.detail}`}
          onPress={onOuvrir}
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
              backgroundColor={`${annonce.ton}-soft`}
              alignItems="center"
              justifyContent="center"
            >
              <Icone nom={annonce.icone} taille={22} couleur={annonce.ton} />
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
    </GestureDetector>
  );
}

// A notification-style banner when the other side answers or creates a booking, on any screen.
export function Bandeau() {
  const { utilisateur, role } = useSession();
  const chemin = usePathname();
  const haut = useSafeAreaInsets().top;
  const [annonce, setAnnonce] = useState<Annonce | null>(null);
  const vues = useRef(new Set<string>());
  const surMesRdv = useRef(false);
  surMesRdv.current = chemin === '/rendez-vous';
  const uid = utilisateur?.id ?? null;
  const roleBandeau = role === 'client' || role === 'fournisseur' ? role : null;
  // Closes only the banner that asked, never a newer one that replaced it.
  const fermer = (cle: string) => setAnnonce((a) => (a?.cle === cle ? null : a));

  useEffect(() => {
    if (!uid || !roleBandeau) {
      setAnnonce(null);
      return;
    }
    return ecouterRendezVous((rdv) => {
      const a = annonceDe(rdv, uid, roleBandeau);
      if (!a || vues.current.has(a.cle) || !estFraiche(rdv)) return;
      vues.current.add(a.cle);
      // On Mes RDV the card's own status change already vibrates.
      if (!surMesRdv.current) (a.ton === 'cancelled' ? vibrer.leger : vibrer.succes)();
      setAnnonce(a);
    });
  }, [uid, roleBandeau]);

  if (!annonce) return null;
  const cle = annonce.cle;
  return (
    <Animated.View
      key={cle}
      entering={entree}
      style={{ position: 'absolute', top: haut + 6, left: 12, right: 12, zIndex: 100 }}
    >
      <Carte
        annonce={annonce}
        onFermer={() => fermer(cle)}
        onOuvrir={() => {
          setAnnonce(null);
          if (annonce.vers === '/demandes' || !surMesRdv.current) router.navigate(annonce.vers);
        }}
      />
    </Animated.View>
  );
}
