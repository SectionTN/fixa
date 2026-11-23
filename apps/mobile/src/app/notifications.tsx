import {
  estNonLue,
  type GenreNotification,
  heureLocale,
  jourCourtLocal,
  jourLocal,
  type NotificationClient,
  notificationsClient,
  sectionnerNotifications,
  textes,
} from '@fixa/core';
import { EtatVide, Icone, type NomIcone, Texte } from '@fixa/ui';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import Animated from 'react-native-reanimated';
import { XStack, YStack } from 'tamagui';
import { BoutonYosr } from '../composants/BoutonYosr';
import { BoutonRetour, Ecran } from '../composants/Ecran';
import { douceApres } from '../composants/Mouvement';
import { ErreurChargement } from '../composants/Section';
import { useMesRendezVous } from '../lib/mesRendezVous';
import { toutLire, useLuesJusqua } from '../lib/notifications';
import { useSession } from '../lib/session';
import { vibrer } from '../lib/vibrer';

const t = textes.notifications;
const MINUTE_MS = 60_000;

const STYLE: Record<GenreNotification, { icone: NomIcone; fond: string; couleur: string }> = {
  confirme: { icone: 'event_available', fond: 'secondary-soft', couleur: 'secondary' },
  envoye: { icone: 'schedule', fond: 'pending-soft', couleur: 'pending' },
  refuse: { icone: 'event_busy', fond: 'cancelled-soft', couleur: 'cancelled' },
  annule: { icone: 'event_busy', fond: 'cancelled-soft', couleur: 'cancelled' },
  expire: { icone: 'timer_off', fond: 'background-soft', couleur: 'color-muted' },
  avis: { icone: 'star_fill', fond: 'accent-soft', couleur: 'star' },
};

// A service title in the middle of a sentence.
const minuscule = (s: string) => s.charAt(0).toLocaleLowerCase() + s.slice(1);

function titreEtTexte(n: NotificationClient): { titre: string; texte: string } {
  const r = n.rdv;
  const quand = t.quand(jourLocal(r.debut), heureLocale(r.debut));
  const service = minuscule(r.serviceTitre);
  switch (n.genre) {
    case 'confirme':
      return { titre: t.confirme, texte: t.confirmeTexte(r.fournisseurNom, quand) };
    case 'envoye':
      return { titre: t.envoye, texte: t.envoyeTexte(r.fournisseurNom, quand) };
    case 'refuse':
      return { titre: t.refuse, texte: t.refuseTexte(r.fournisseurNom, service) };
    case 'annule':
      return { titre: t.annule, texte: t.annuleTexte(r.fournisseurNom, service, quand) };
    case 'expire':
      return { titre: t.expire, texte: t.expireTexte(r.fournisseurNom) };
    case 'avis':
      return { titre: t.avis, texte: t.avisTexte(service, r.fournisseurNom) };
  }
}

// Minutes within the hour, the time today, else the day.
function moment(quand: string, aujourdhui: boolean, maintenant: Date): string {
  if (!aujourdhui) return jourCourtLocal(quand);
  const minutes = Math.floor((maintenant.getTime() - Date.parse(quand)) / MINUTE_MS);
  if (minutes < 1) return t.aLinstant;
  if (minutes < 60) return t.ilYa(minutes);
  return heureLocale(quand);
}

function Ligne({
  n,
  nonLue,
  heure,
  onPress,
  onAvis,
}: {
  n: NotificationClient;
  nonLue: boolean;
  heure: string;
  onPress: () => void;
  onAvis: () => void;
}) {
  const style = STYLE[n.genre];
  const { titre, texte } = titreEtTexte(n);
  return (
    <XStack
      role="button"
      aria-label={`${titre}. ${texte}`}
      gap={14}
      padding="4"
      borderRadius="5"
      backgroundColor={
        nonLue ? 'surface press:background-press' : 'transparent press:background-press'
      }
      onPress={onPress}
    >
      <XStack
        width={44}
        height={44}
        borderRadius="round"
        backgroundColor={style.fond}
        alignItems="center"
        justifyContent="center"
      >
        <Icone nom={style.icone} taille={22} couleur={style.couleur} />
      </XStack>
      <YStack flex={1} gap="1" minWidth={0}>
        <XStack gap="2" alignItems="center">
          <Texte flex={1} fontSize="5" fontWeight="600" numberOfLines={1}>
            {titre}
          </Texte>
          <Texte fontSize="2" color="color-muted">
            {heure}
          </Texte>
          {nonLue ? (
            <YStack width={8} height={8} borderRadius="round" backgroundColor="primary" />
          ) : null}
        </XStack>
        <Texte fontSize="4" color="color-muted">
          {texte}
        </Texte>
        {n.genre === 'avis' ? (
          <XStack
            role="button"
            aria-label={t.laisserAvis}
            alignSelf="flex-start"
            height={36}
            marginTop="2"
            paddingHorizontal="4"
            borderRadius="round"
            backgroundColor="primary-soft press:background-press"
            alignItems="center"
            hitSlop={{ top: 4, bottom: 4 }}
            onPress={onAvis}
          >
            <Texte fontSize="3" fontWeight="600" color="on-primary-soft">
              {t.laisserAvis}
            </Texte>
          </XStack>
        ) : null}
      </YStack>
    </XStack>
  );
}

// What happened to the client's requests, newest first, from the same rows as Mes RDV.
export default function Notifications() {
  const router = useRouter();
  const { utilisateur } = useSession();
  const uid = utilisateur?.id ?? null;
  const lecture = useMesRendezVous(uid);
  const luesJusqua = useLuesJusqua(uid);
  const d = lecture.donnees;
  const sections = useMemo(
    () => (d ? sectionnerNotifications(notificationsClient(d.liste), d.maintenant) : null),
    [d],
  );
  const nonLues = sections?.some((s) => s.notifications.some((n) => estNonLue(n, luesJusqua)));
  let rang = 0;

  return (
    <YStack flex={1}>
      {/* Room under the last row for the Yosr button. */}
      <Ecran paddingTop="1" paddingHorizontal="5" paddingBottom={100} gap="4">
        <XStack gap="3" alignItems="center">
          <BoutonRetour onPress={() => router.back()} />
          <Texte flex={1} fontSize="8" fontWeight="600" numberOfLines={1}>
            {t.titre}
          </Texte>
          {nonLues ? (
            <Texte
              role="button"
              fontSize="4"
              fontWeight="600"
              color="primary"
              paddingVertical="2"
              onPress={() => {
                vibrer.selection();
                if (uid) toutLire(uid);
              }}
            >
              {t.toutLire}
            </Texte>
          ) : null}
        </XStack>

        {lecture.erreur && !d ? <ErreurChargement onReessayer={lecture.recharger} /> : null}

        {sections && sections.length === 0 ? (
          <EtatVide icone="notifications" titre={t.vide} texte={t.videTexte} />
        ) : null}

        {sections?.map((s) => (
          <YStack key={s.cle} gap="2">
            <Texte fontSize="3" fontWeight="500" color="color-muted" paddingStart="1">
              {t.sections[s.cle]}
            </Texte>
            {s.notifications.map((n) => {
              rang += 1;
              return (
                <Animated.View key={n.id} entering={douceApres(Math.min(rang, 8) * 40)}>
                  <Ligne
                    n={n}
                    nonLue={estNonLue(n, luesJusqua)}
                    heure={moment(n.quand, s.cle === 'aujourdhui', d?.maintenant ?? new Date())}
                    onPress={() => router.navigate('/rendez-vous')}
                    onAvis={() => router.push(`/rendez-vous/${n.rdv.$id}/avis`)}
                  />
                </Animated.View>
              );
            })}
          </YStack>
        ))}
      </Ecran>
      <BoutonYosr />
    </YStack>
  );
}
