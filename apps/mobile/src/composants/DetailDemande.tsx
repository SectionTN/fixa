import {
  delaiDepasse,
  formatDuree,
  formatPrixService,
  getRendezVous,
  heureLocale,
  initiales,
  jourCourtLocal,
  jourLocal,
  LONGUEUR_MAX,
  libelleRecue,
  motifRefus,
  tempsRestant,
  textes,
} from '@fixa/core';
import {
  BadgeStatut,
  Bouton,
  ChampTexte,
  EtatVide,
  Feuille,
  Icone,
  type NomIcone,
  Puce,
  Texte,
} from '@fixa/ui';
import { Stack } from 'expo-router';
import { type ReactNode, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { tables } from '../lib/appwrite';
import { repondre, useVersion } from '../lib/demandes';
import { useLecture } from '../lib/donnees';
import { vibrer } from '../lib/vibrer';
import { BoutonRetour, useHaut } from './Ecran';
import { ErreurChargement } from './Section';

const t = textes.demandes;
const MESSAGE_MAX = 300;

const majuscule = (texte: string) => `${texte.charAt(0).toUpperCase()}${texte.slice(1)}`;
const prenomDe = (nom: string) => nom.trim().split(/\s+/)[0] ?? nom;

function Ligne({
  icone,
  libelle,
  children,
}: {
  icone: NomIcone;
  libelle: string;
  children: ReactNode;
}) {
  return (
    <XStack gap="3" alignItems="center" paddingVertical="3">
      <XStack
        width={36}
        height={36}
        borderRadius={12}
        backgroundColor="background-soft"
        alignItems="center"
        justifyContent="center"
      >
        <Icone nom={icone} taille={20} couleur="color-muted" />
      </XStack>
      <YStack flex={1} minWidth={0} gap={2}>
        <Texte fontSize="2" color="color-muted">
          {libelle}
        </Texte>
        {children}
      </YStack>
    </XStack>
  );
}

export type DetailDemandeProps = {
  id: string;
  /** Opens with the refuse sheet up, from a card's Refuser. */
  refuser?: boolean;
  /** Back to the list as its own screen. Left out in the pane next to the list, which sits above the tab bar. */
  onRetour?: () => void;
};

// One request with its deadline, then Accepter or the refuse sheet with a reason and an optional message.
export function DetailDemande({ id, refuser = false, onRetour }: DetailDemandeProps) {
  const insets = useSafeAreaInsets();
  const bottom = onRetour ? insets.bottom : 0;
  const top = useHaut();
  const version = useVersion();
  const [feuille, setFeuille] = useState(refuser);
  const [raison, setRaison] = useState<string | null>(null);
  const [mot, setMot] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const verrou = useRef(false);

  const lecture = useLecture(
    `demande:${id}`,
    async () => ({ rdv: await getRendezVous(tables, id), maintenant: new Date() }),
    version,
  );
  const d = lecture.donnees;
  const rdv = d?.rdv ?? null;

  const agir = async (action: 'accepter' | 'refuser') => {
    if (!rdv || verrou.current) return;
    verrou.current = true;
    setEnvoi(true);
    setMessage(null);
    const r = await repondre(
      rdv.$id,
      action,
      action === 'refuser' ? motifRefus(raison ?? '', mot) : undefined,
    );
    verrou.current = false;
    setEnvoi(false);
    setFeuille(false);
    if (r.ok) {
      vibrer.leger();
      onRetour?.();
    } else setMessage(r.message);
  };

  if (!d || !rdv) {
    return (
      <YStack
        flex={1}
        backgroundColor="background"
        paddingTop={top + 8}
        paddingHorizontal="5"
        gap="5"
      >
        {onRetour ? <BoutonRetour onPress={onRetour} /> : null}
        {lecture.erreur ? <ErreurChargement onReessayer={lecture.recharger} /> : null}
        {d && !rdv ? <EtatVide icone="inbox" titre={t.introuvable} texte="" /> : null}
      </YStack>
    );
  }

  const enRetard = delaiDepasse(rdv, d.maintenant);
  const ouvert = rdv.statut === 'EN_ATTENTE' && !enRetard;
  const reste = tempsRestant(rdv.dateLimiteReponse, d.maintenant);
  const prenom = prenomDe(rdv.clientNom);

  return (
    <YStack flex={1} backgroundColor="background">
      {/* The refuse sheet keeps the back swipe from closing the request under it. */}
      {onRetour ? <Stack.Screen options={{ gestureEnabled: !feuille }} /> : null}
      <YStack flex={1} aria-hidden={feuille}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: top + 8,
            paddingHorizontal: 20,
            paddingBottom: 24,
            gap: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          <XStack gap="3" alignItems="center">
            {onRetour ? <BoutonRetour onPress={onRetour} /> : null}
            <YStack flex={1}>
              <Texte fontSize="6" fontWeight="600" numberOfLines={1}>
                {rdv.statut === 'EN_ATTENTE' ? t.nouvelle : t.demande}
              </Texte>
              <Texte fontSize="3" color="color-muted" numberOfLines={1}>
                {t.recue(libelleRecue(rdv.$createdAt, d.maintenant))}
              </Texte>
            </YStack>
            <YStack justifyContent="center">
              {enRetard ? (
                <BadgeStatut statut="EXPIRE" libelle={t.delaiDepasse} />
              ) : (
                <BadgeStatut statut={rdv.statut} libelle={textes.statuts[rdv.statut]} />
              )}
            </YStack>
          </XStack>

          {ouvert ? (
            <XStack
              paddingVertical="3"
              paddingHorizontal="4"
              gap="3"
              borderRadius="5"
              backgroundColor="pending-soft"
              alignItems="center"
            >
              <Icone nom="timer" taille={22} couleur="pending" />
              <Texte flex={1} fontSize="5" fontWeight="600" color="pending">
                {t.repondezAvant(heureLocale(rdv.dateLimiteReponse))}
              </Texte>
              {reste ? (
                <Texte fontSize="4" color="pending">
                  {t.encore(reste)}
                </Texte>
              ) : null}
            </XStack>
          ) : null}

          {message ? (
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
                {message}
              </Texte>
            </XStack>
          ) : null}

          <XStack
            padding="4"
            gap="4"
            borderRadius="5"
            backgroundColor="surface"
            alignItems="center"
          >
            <XStack
              width={52}
              height={52}
              borderRadius="round"
              backgroundColor="primary-soft"
              alignItems="center"
              justifyContent="center"
            >
              <Texte fontSize="6" fontWeight="600" color="on-primary-soft">
                {initiales(rdv.clientNom)}
              </Texte>
            </XStack>
            <YStack flex={1} gap={2}>
              <Texte fontSize="6" fontWeight="600">
                {rdv.clientNom}
              </Texte>
              {rdv.clientTelephone ? (
                <Texte fontSize="4" color="color-muted">
                  {rdv.clientTelephone}
                </Texte>
              ) : null}
            </YStack>
          </XStack>

          <YStack
            paddingHorizontal="4"
            paddingVertical="2"
            borderRadius="5"
            backgroundColor="surface"
          >
            <Ligne icone="handyman" libelle={textes.reservation.service}>
              <Texte fontSize={15} fontWeight="500">
                {`${rdv.serviceTitre} · ${formatDuree(rdv.duree)} · ${formatPrixService(rdv)}`}
              </Texte>
            </Ligne>
            <YStack height={1} backgroundColor="border-color" />
            <Ligne icone="calendar_month" libelle={textes.reservation.dateHeure}>
              <Texte fontSize={15} fontWeight="500">
                {`${majuscule(jourLocal(rdv.debut))} · ${heureLocale(rdv.debut)}`}
              </Texte>
            </Ligne>
            {rdv.adresse ? (
              <>
                <YStack height={1} backgroundColor="border-color" />
                <Ligne icone="location_on" libelle={textes.reservation.adresse}>
                  <Texte fontSize={15} fontWeight="500">
                    {rdv.adresse}
                  </Texte>
                </Ligne>
              </>
            ) : null}
          </YStack>

          {rdv.description ? (
            <YStack gap="2">
              <Texte fontSize="5" fontWeight="600">
                {t.probleme}
              </Texte>
              <Texte fontSize="5" lineHeight="24px">
                {rdv.description}
              </Texte>
            </YStack>
          ) : null}
          {rdv.estUrgent && rdv.source === 'CHATBOT' ? (
            <XStack
              alignSelf="flex-start"
              height={32}
              paddingHorizontal="3"
              gap={5}
              borderRadius="round"
              backgroundColor="primary-soft"
              alignItems="center"
            >
              <Icone nom="bolt" taille={16} couleur="on-primary-soft" />
              <Texte fontSize="3" fontWeight="600" color="on-primary-soft">
                {t.urgenceYosr}
              </Texte>
            </XStack>
          ) : null}
          {rdv.motif ? (
            <Texte fontSize="4" color="color-muted">
              {t.motifRecu(rdv.motif)}
            </Texte>
          ) : null}
        </ScrollView>

        {ouvert ? (
          <YStack
            paddingTop="4"
            paddingHorizontal="5"
            paddingBottom={Math.max(bottom, 16) + 8}
            gap="3"
            borderTopWidth={1}
            borderColor="border-color"
            backgroundColor="surface"
          >
            <Bouton taille="lg" icone="check" desactive={envoi} onPress={() => agir('accepter')}>
              {t.accepterDemande}
            </Bouton>
            <Bouton
              taille="lg"
              variante="danger"
              desactive={envoi}
              onPress={() => setFeuille(true)}
            >
              {t.refuser}
            </Bouton>
          </YStack>
        ) : null}
      </YStack>

      <Feuille
        ouverte={feuille && ouvert}
        onFermer={() => setFeuille(false)}
        hauteur={70}
        margeBas={bottom}
        pied={
          <YStack flex={1}>
            <Bouton
              taille="lg"
              variante="destructif"
              desactive={!raison || envoi}
              onPress={() => agir('refuser')}
            >
              {t.refuser}
            </Bouton>
          </YStack>
        }
      >
        <YStack gap="4">
          <YStack gap={2}>
            <Texte fontSize="7" fontWeight="600">
              {t.refuserTitre}
            </Texte>
            <Texte fontSize="4" color="color-muted">
              {`${rdv.clientNom} · ${jourCourtLocal(rdv.debut).toLowerCase()} · ${heureLocale(rdv.debut)}`}
            </Texte>
          </YStack>
          <Texte fontSize={15} fontWeight="600">
            {t.motif}
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
          <ChampTexte
            libelle={t.messageA(prenom)}
            valeur={mot}
            onChange={setMot}
            maxLength={Math.min(MESSAGE_MAX, LONGUEUR_MAX.motif)}
            aide={textes.reservation.compteur(mot.length, MESSAGE_MAX)}
            multiligne
          />
        </YStack>
      </Feuille>
    </YStack>
  );
}
