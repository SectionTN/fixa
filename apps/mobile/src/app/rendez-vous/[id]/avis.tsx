import {
  actionsRendezVous,
  CRITERES_AVIS,
  fr,
  getFournisseur,
  getRendezVous,
  initiales,
  jourLocal,
  LONGUEUR_MAX,
  libelleNote,
} from '@fixa/core';
import { Bouton, ChampTexte, ChoixNote, Icone, Puce, Texte } from '@fixa/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { BoutonRetour, CadreLateral, useHaut } from '../../../composants/Ecran';
import { decalageChamp, PiedClavier } from '../../../composants/PiedClavier';
import { tables } from '../../../lib/appwrite';
import { couleurDe, lireCategories, useLecture } from '../../../lib/donnees';
import { laisserAvis } from '../../../lib/mesRendezVous';

const t = fr.avis;

// Rate a completed appointment: stars, what went well, a comment, then one review through the function.
function Avis() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const top = useHaut();
  const { bottom } = useSafeAreaInsets();
  const [note, setNote] = useState(0);
  const [criteres, setCriteres] = useState<string[]>([]);
  const [commentaire, setCommentaire] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [hauteurPied, setHauteurPied] = useState(0);
  const verrou = useRef(false);

  const lecture = useLecture(`avis:${id}`, async () => {
    const rdv = await getRendezVous(tables, id);
    const [pro, categories] = rdv
      ? await Promise.all([getFournisseur(tables, rdv.fournisseurId), lireCategories()])
      : [null, []];
    return {
      rdv,
      couleur: pro ? couleurDe(categories, pro.categorieId) : 'cat1',
      maintenant: new Date(),
    };
  });
  const d = lecture.donnees;
  const rdv = d?.rdv ?? null;
  const possible = rdv && d ? actionsRendezVous(rdv, d.maintenant).includes('avis') : false;
  const dejaFait = rdv?.aAvis === true;

  const basculer = (c: string) =>
    setCriteres((liste) => (liste.includes(c) ? liste.filter((x) => x !== c) : [...liste, c]));

  const publier = async () => {
    if (!rdv || note === 0 || verrou.current) return;
    // The footer rides on the keyboard, so a failure line under the field would stay behind it.
    Keyboard.dismiss();
    verrou.current = true;
    setEnvoi(true);
    setMessage(null);
    const r = await laisserAvis({
      rendezVousId: rdv.$id,
      note,
      criteres,
      commentaire: commentaire.trim(),
    });
    if (r.ok) {
      router.back();
      return;
    }
    verrou.current = false;
    setEnvoi(false);
    setMessage(r.message);
  };

  const alerte =
    message ??
    (dejaFait ? fr.erreurs.DEJA_EVALUE : lecture.erreur && !d ? fr.erreurs.RESEAU : null);

  return (
    <YStack flex={1} backgroundColor="background">
      <XStack paddingTop={top + 4} paddingHorizontal="5" gap="3" alignItems="center">
        <BoutonRetour fermer onPress={() => router.back()} />
        <Texte flex={1} fontSize="6" fontWeight="600">
          {t.titre}
        </Texte>
      </XStack>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        bottomOffset={decalageChamp(hauteurPied, bottom, true)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 24,
          gap: 16,
        }}
      >
        {rdv && d ? (
          <XStack
            gap={14}
            padding={14}
            borderRadius="5"
            backgroundColor="surface"
            alignItems="center"
          >
            <XStack
              width={56}
              height={56}
              borderRadius={18}
              backgroundColor={`${d.couleur}-soft`}
              alignItems="center"
              justifyContent="center"
            >
              <Texte fontSize="6" fontWeight="600" color={d.couleur}>
                {initiales(rdv.fournisseurNom)}
              </Texte>
            </XStack>
            <YStack flex={1} minWidth={0} gap={3}>
              <Texte fontSize="5" fontWeight="600" numberOfLines={1}>
                {rdv.fournisseurNom}
              </Texte>
              <Texte fontSize="3" color="color-muted" numberOfLines={1}>
                {`${rdv.serviceTitre} · ${jourLocal(rdv.debut)}`}
              </Texte>
            </YStack>
          </XStack>
        ) : null}

        <YStack gap={14} alignItems="center" marginTop={4}>
          <Texte fontSize="7" fontWeight="600" textAlign="center">
            {t.question}
          </Texte>
          <ChoixNote note={note} onChange={setNote} libelle={t.etoile} />
          <Texte fontSize={15} fontWeight="500" color="color-muted">
            {libelleNote(note)}
          </Texte>
        </YStack>

        <YStack gap="3">
          <Texte fontSize={15} fontWeight="600">
            {t.plu}
          </Texte>
          <XStack flexWrap="wrap" gap="2">
            {CRITERES_AVIS.map((c) => {
              const choisi = criteres.includes(c);
              return (
                <Puce
                  key={c}
                  libelle={c}
                  etat={choisi ? 'choisi' : 'repos'}
                  icone={choisi ? 'check' : undefined}
                  onPress={() => basculer(c)}
                />
              );
            })}
          </XStack>
        </YStack>

        <ChampTexte
          libelle={t.commentaire}
          placeholder={t.indice}
          valeur={commentaire}
          onChange={setCommentaire}
          maxLength={LONGUEUR_MAX.commentaire}
          aide={fr.reservation.compteur(commentaire.length, LONGUEUR_MAX.commentaire)}
          multiligne
        />

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
      </KeyboardAwareScrollView>

      <PiedClavier bas={bottom} onHauteur={setHauteurPied} paddingTop={14}>
        <YStack flex={1}>
          <Bouton taille="lg" desactive={note === 0 || envoi || !possible} onPress={publier}>
            {t.publier}
          </Bouton>
        </YStack>
      </PiedClavier>
    </YStack>
  );
}

export default function EcranAvis() {
  return (
    <CadreLateral>
      <Avis />
    </CadreLateral>
  );
}
