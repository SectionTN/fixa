import {
  actionsRendezVous,
  estAnnulationTardive,
  heureLocale,
  jourCourtLocal,
  textes,
} from '@fixa/core';
import { Bouton, Icone, Puce, Texte } from '@fixa/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { annuler, useRendezVous } from '../../../lib/mesRendezVous';

const t = textes.rendezVous.annulation;

// The cancel sheet: a reason, the free-cancellation rule, then the cancellation through the function.
export default function Annuler() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lecture = useRendezVous(id);
  const [raison, setRaison] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  // Set once cancelled, so the re-read landing while the sheet closes is not shown as someone else's change.
  const [fait, setFait] = useState(false);
  const verrou = useRef(false);

  const d = lecture.donnees;
  const rdv = d?.rdv ?? null;
  const possible = rdv && d ? actionsRendezVous(rdv, d.maintenant).includes('annuler') : false;
  const change = !fait && d !== null && !lecture.chargement && !possible;

  const confirmer = async () => {
    if (!rdv || !raison || verrou.current) return;
    verrou.current = true;
    setEnvoi(true);
    setMessage(null);
    const r = await annuler(rdv.$id, raison);
    setEnvoi(false);
    if (r.ok) {
      setFait(true);
      router.back();
      return;
    }
    verrou.current = false;
    setMessage(r.message);
  };

  const alerte =
    message ??
    (change
      ? textes.erreurs.TRANSITION_INVALIDE
      : lecture.erreur && !d
        ? textes.erreurs.RESEAU
        : null);

  return (
    <YStack
      backgroundColor="surface"
      paddingTop={Platform.OS === 'ios' ? 28 : 10}
      paddingHorizontal="5"
      paddingBottom={insets.bottom + 16}
      gap={18}
    >
      {Platform.OS === 'android' ? (
        <XStack justifyContent="center" paddingBottom={4}>
          <YStack width={40} height={5} borderRadius="round" backgroundColor="border-strong" />
        </XStack>
      ) : null}
      <XStack gap={14} alignItems="center">
        <XStack
          width={52}
          height={52}
          borderRadius="round"
          backgroundColor="cancelled-soft"
          alignItems="center"
          justifyContent="center"
        >
          <Icone nom="event_busy" taille={26} couleur="cancelled" />
        </XStack>
        <YStack flex={1} minWidth={0} gap={2}>
          <Texte fontSize="7" fontWeight="600">
            {t.titre}
          </Texte>
          <Texte fontSize="4" color="color-muted" numberOfLines={1} minHeight={20}>
            {rdv
              ? `${rdv.fournisseurNom} · ${jourCourtLocal(rdv.debut).toLowerCase()} · ${heureLocale(rdv.debut)}`
              : ''}
          </Texte>
        </YStack>
      </XStack>
      <Texte fontSize={15} fontWeight="600">
        {t.pourquoi}
      </Texte>
      <XStack flexWrap="wrap" gap="2" role="radiogroup">
        {t.motifs.map((m) => (
          <Puce
            key={m}
            libelle={m}
            etat={raison === m ? 'choisi' : 'repos'}
            icone={raison === m ? 'check' : undefined}
            onPress={() => setRaison(m)}
          />
        ))}
      </XStack>
      {rdv ? (
        <XStack
          paddingVertical="3"
          paddingHorizontal={14}
          gap={10}
          borderRadius={18}
          backgroundColor="secondary-soft"
          alignItems="flex-start"
        >
          <Icone nom="info" taille={20} couleur="secondary" />
          <Texte flex={1} fontSize="3" lineHeight="19px">
            {estAnnulationTardive(new Date(rdv.debut), new Date())
              ? t.tardive(rdv.fournisseurNom)
              : t.gratuite(rdv.fournisseurNom)}
          </Texte>
        </XStack>
      ) : null}
      {alerte ? (
        <XStack
          padding="3"
          gap="2"
          borderRadius="4"
          backgroundColor="cancelled-soft"
          alignItems="center"
          role="alert"
        >
          <Icone nom="error" taille={18} couleur="cancelled" />
          <Texte flex={1} fontSize="4" color="cancelled">
            {alerte}
          </Texte>
        </XStack>
      ) : null}
      <Bouton
        taille="lg"
        variante="destructif"
        desactive={!raison || envoi || fait || !possible}
        onPress={confirmer}
      >
        {t.confirmer}
      </Bouton>
    </YStack>
  );
}
