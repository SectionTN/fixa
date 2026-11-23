import {
  analyserMessage,
  type Categorie,
  type FournisseurAffiche,
  textes,
  trierFournisseurs,
  villeCitee,
} from '@fixa/core';
import { Icone, Puce, Texte } from '@fixa/ui';
import { useRouter } from 'expo-router';
import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { I18nManager, Platform, ScrollView, TextInput } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { CartePro } from '../composants/CartePro';
import { BoutonRetour } from '../composants/Ecran';
import { Appui, entreeDouce, PointsEcriture } from '../composants/Mouvement';
import { useCouleur } from '../composants/Onglet';
import { VisageYosr } from '../composants/VisageYosr';
import {
  chargerFournisseurs,
  couleurDe,
  lireCategories,
  lireProfil,
  positionDe,
} from '../lib/donnees';
import { useSession } from '../lib/session';
import { vibrer } from '../lib/vibrer';

const t = textes.yosr;
const PAUSE = 650;

type Choix = {
  libelle: string;
  action: 'urgence' | 'trouver' | 'rdv' | 'categorie' | 'tous';
  id?: string;
};
type Message =
  | { id: number; de: 'yosr'; texte: string; choix?: Choix[] }
  | { id: number; de: 'moi'; texte: string }
  | { id: number; de: 'conseil'; texte: string }
  | {
      id: number;
      de: 'pros';
      pros: FournisseurAffiche[];
      categories: Categorie[];
      maintenant: Date;
    };
type Nouveau = Message extends infer M ? (M extends Message ? Omit<M, 'id'> : never) : never;

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));
const NB_PROS = 3;
const parPrix = (a: FournisseurAffiche, b: FournisseurAffiche) =>
  (a.prixMin ?? Number.POSITIVE_INFINITY) - (b.prixMin ?? Number.POSITIVE_INFINITY);

// Read at call time, so the chips follow the current language.
const choixAccueil = (): Choix[] => [
  { libelle: t.choixUrgence, action: 'urgence' },
  { libelle: t.choixTrouver, action: 'trouver' },
  { libelle: t.choixRdv, action: 'rdv' },
];

function Avatar({ taille }: { taille: number }) {
  return <VisageYosr taille={taille} fond="yosr-face" encre="yosr-ink" />;
}

// Yosr in guided mode: reads the need in French, Derja, Arabic or English and shows matching pros.
export default function Yosr() {
  const router = useRouter();
  const { utilisateur } = useSession();
  const { top, bottom } = useSafeAreaInsets();
  const prenom = utilisateur?.nom.split(' ')[0];
  const [messages, setMessages] = useState<Message[]>([]);
  const [ecrit, setEcrit] = useState(false);
  const [texte, setTexte] = useState('');
  const urgence = useRef(false);
  const moinsChers = useRef(false);
  const dits = useRef<string[]>([]);
  const occupe = useRef(false);
  const compteur = useRef(0);
  const liste = useRef<ComponentRef<typeof ScrollView>>(null);
  const muted = useCouleur('color-subtle');
  const couleurTexte = useCouleur('color');

  const ajouter = (m: Nouveau) => {
    compteur.current += 1;
    setMessages((ms) => [...ms, { ...m, id: compteur.current } as Message]);
  };

  const repondre = async (suite: Nouveau[]) => {
    for (const m of suite) {
      setEcrit(true);
      await attendre(PAUSE);
      setEcrit(false);
      ajouter(m);
      vibrer.leger();
    }
  };

  // The latest city the client named in this conversation, if any.
  const villeDuFil = (villes: string[]) => {
    for (const dit of [...dits.current].reverse()) {
      const ville = villeCitee(dit, villes);
      if (ville) return ville;
    }
    return null;
  };

  const choixCategories = async (): Promise<Choix[]> => {
    const categories = await lireCategories().catch(() => []);
    return categories.map((c) => ({ libelle: c.nom, action: 'categorie', id: c.$id }));
  };

  const chercher = async (categorieId: string) => {
    const categories = await lireCategories().catch(() => [] as Categorie[]);
    const metier =
      textes.recherche.metiers[categorieId] ??
      categories.find((c) => c.$id === categorieId)?.nom ??
      '';
    const conseil = urgence.current ? t.conseils[categorieId] : undefined;
    const debut: Nouveau[] = [
      { de: 'yosr', texte: urgence.current ? t.chercheUrgence(metier) : t.cherche(metier) },
      ...(conseil ? [{ de: 'conseil' as const, texte: conseil }] : []),
    ];
    const chargement = (async () => {
      const maintenant = new Date();
      const profil = utilisateur ? await lireProfil(utilisateur.id) : null;
      const pros = await chargerFournisseurs(
        { categorieIds: [categorieId] },
        positionDe(profil),
        maintenant,
      );
      return { pros: trierFournisseurs(pros), maintenant };
    })();
    // Read while the first lines play, a failure is handled where it is awaited below.
    chargement.catch(() => {});
    await repondre(debut);
    try {
      const { pros: tous, maintenant } = await chargement;
      if (tous.length === 0) {
        await repondre([{ de: 'yosr', texte: t.aucunPro, choix: await choixCategories() }]);
        return;
      }
      const ville = villeDuFil(tous.map((p) => p.ville));
      const ici = ville ? tous.filter((p) => p.ville === ville) : [];
      const base = ici.length > 0 ? ici : tous;
      const pros = (moinsChers.current ? [...base].sort(parPrix) : base).slice(0, NB_PROS);
      const intro = !ville
        ? t.trouves(pros.length)
        : ici.length > 0
          ? t.trouvesVille(pros.length, ville)
          : t.aucunVille(ville);
      await repondre([
        { de: 'yosr', texte: intro },
        ...(moinsChers.current && pros.length > 1
          ? [{ de: 'yosr' as const, texte: t.moinsChers }]
          : []),
        { de: 'pros', pros, categories, maintenant },
        {
          de: 'yosr',
          texte: '',
          choix: [{ libelle: t.voirTous, action: 'tous', id: categorieId }],
        },
      ]);
    } catch {
      await repondre([{ de: 'yosr', texte: t.erreur }]);
    }
  };

  // One exchange at a time, so a second message waits for Yosr's whole answer.
  const seul = async (action: () => Promise<void>) => {
    if (occupe.current) return;
    occupe.current = true;
    try {
      await action();
    } finally {
      occupe.current = false;
    }
  };

  const envoyer = (contenu: string) =>
    seul(async () => {
      const propre = contenu.trim();
      if (!propre) return;
      setTexte('');
      ajouter({ de: 'moi', texte: propre });
      dits.current.push(propre);
      const analyse = analyserMessage(propre);
      if (analyse.urgence) urgence.current = true;
      if (analyse.prix) moinsChers.current = true;
      if (analyse.categorieId) {
        await chercher(analyse.categorieId);
        return;
      }
      if (analyse.intention) {
        const texte = analyse.intention === 'merci' ? t.deRien : t.salut(prenom);
        await repondre([{ de: 'yosr', texte, choix: choixAccueil() }]);
        return;
      }
      // A city or a budget without a service is kept for the next answer.
      const compris = analyse.prix || villeCitee(propre, []) !== null;
      await repondre([
        {
          de: 'yosr',
          texte: compris ? t.questionService : t.incompris,
          choix: await choixCategories(),
        },
      ]);
    });

  const choisir = (c: Choix) => seul(() => repondreAuChoix(c));

  const repondreAuChoix = async (c: Choix) => {
    vibrer.selection();
    if (c.action === 'rdv') {
      router.back();
      router.navigate('/rendez-vous');
      return;
    }
    if (c.action === 'tous' && c.id) {
      router.back();
      router.push({ pathname: '/categorie/[id]', params: { id: c.id } });
      return;
    }
    ajouter({ de: 'moi', texte: c.libelle });
    if (c.action === 'urgence') {
      urgence.current = true;
      await repondre([{ de: 'yosr', texte: t.questionUrgence }]);
    } else if (c.action === 'trouver') {
      await repondre([{ de: 'yosr', texte: t.questionService, choix: await choixCategories() }]);
    } else if (c.id) {
      await chercher(c.id);
    }
  };

  useEffect(() => {
    seul(() =>
      repondre([
        {
          de: 'yosr',
          texte: t.bonjour(prenom),
          choix: choixAccueil(),
        },
      ]),
    );
  }, []);

  const dernier = messages.at(-1);
  return (
    <YStack flex={1} backgroundColor="background">
      <XStack
        paddingHorizontal="5"
        paddingTop={Platform.OS === 'ios' ? 20 : top + 12}
        paddingBottom="4"
        gap="3"
        alignItems="center"
        backgroundColor="surface"
        borderBottomWidth={1}
        borderColor="border-color"
      >
        <Avatar taille={48} />
        <YStack flex={1} gap="1">
          <Texte fontSize="6" fontWeight="600">
            {t.nom}
          </Texte>
          <XStack gap="2" alignItems="center">
            <XStack width={8} height={8} borderRadius="round" backgroundColor="completed" />
            <Texte fontSize="3" color="color-muted">
              {t.statut}
            </Texte>
          </XStack>
        </YStack>
        <BoutonRetour fermer onPress={() => router.back()} />
      </XStack>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          ref={liste}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onContentSizeChange={() => liste.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m) => (
            <Animated.View key={m.id} entering={entreeDouce}>
              {m.de === 'moi' ? (
                <XStack justifyContent="flex-end">
                  <YStack
                    maxWidth="82%"
                    backgroundColor="primary"
                    paddingHorizontal="4"
                    paddingVertical="3"
                    borderRadius={22}
                    borderBottomEndRadius={6}
                  >
                    <Texte fontSize="5" color="on-primary">
                      {m.texte}
                    </Texte>
                  </YStack>
                </XStack>
              ) : m.de === 'conseil' ? (
                <XStack
                  marginStart={44}
                  maxWidth="82%"
                  gap="3"
                  backgroundColor="secondary-soft"
                  padding="4"
                  borderRadius={20}
                >
                  <Icone nom="lightbulb" taille={20} couleur="secondary" />
                  <Texte flex={1} fontSize="4">
                    {m.texte}
                  </Texte>
                </XStack>
              ) : m.de === 'pros' ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginHorizontal: -20 }}
                  contentContainerStyle={{ paddingHorizontal: 64, gap: 12 }}
                >
                  {m.pros.map((p) => (
                    <CartePro
                      key={p.$id}
                      pro={p}
                      variante="verticale"
                      couleur={couleurDe(m.categories, p.categorieId)}
                      maintenant={m.maintenant}
                      onPress={() => {
                        router.back();
                        router.push({ pathname: '/pro/[id]', params: { id: p.$id } });
                      }}
                    />
                  ))}
                </ScrollView>
              ) : (
                <YStack gap="3">
                  {m.texte ? (
                    <XStack gap="2" alignItems="flex-end">
                      <Avatar taille={28} />
                      <YStack
                        maxWidth="82%"
                        backgroundColor="surface"
                        borderWidth={1}
                        borderColor="border-color"
                        paddingHorizontal="4"
                        paddingVertical="3"
                        borderRadius={22}
                        borderBottomStartRadius={6}
                      >
                        <Texte fontSize="5">{m.texte}</Texte>
                      </YStack>
                    </XStack>
                  ) : null}
                  {m.choix && m === dernier ? (
                    <XStack marginStart={36} gap="2" flexWrap="wrap">
                      {m.choix.map((c) => (
                        <Puce
                          key={c.libelle}
                          libelle={c.libelle}
                          etat="contour"
                          onPress={() => choisir(c)}
                        />
                      ))}
                    </XStack>
                  ) : null}
                </YStack>
              )}
            </Animated.View>
          ))}
          {ecrit ? (
            <Animated.View entering={entreeDouce}>
              <XStack gap="2" alignItems="flex-end">
                <Avatar taille={28} />
                <XStack
                  backgroundColor="surface"
                  borderWidth={1}
                  borderColor="border-color"
                  paddingHorizontal="4"
                  paddingVertical="2"
                  borderRadius={22}
                  borderBottomStartRadius={6}
                >
                  <PointsEcriture couleur={muted} />
                </XStack>
              </XStack>
            </Animated.View>
          ) : null}
        </ScrollView>
        <XStack
          paddingHorizontal="4"
          paddingTop="3"
          paddingBottom={Math.max(bottom, 12)}
          gap="3"
          alignItems="center"
          backgroundColor="surface"
          borderTopWidth={1}
          borderColor="border-color"
        >
          <XStack
            flex={1}
            height={50}
            borderRadius={25}
            backgroundColor="background-soft"
            paddingHorizontal="4"
            alignItems="center"
          >
            <TextInput
              value={texte}
              onChangeText={setTexte}
              placeholder={t.indice}
              placeholderTextColor={muted}
              returnKeyType="send"
              submitBehavior="submit"
              onSubmitEditing={() => envoyer(texte)}
              style={{
                flex: 1,
                fontSize: 16,
                color: couleurTexte,
                fontFamily: 'ReadexPro_400Regular',
                textAlign: I18nManager.isRTL ? 'right' : 'left',
              }}
            />
          </XStack>
          <Appui
            accessibilityRole="button"
            accessibilityLabel={t.envoyer}
            onPress={() => envoyer(texte)}
            hitSlop={6}
          >
            <XStack
              width={50}
              height={50}
              borderRadius="round"
              backgroundColor={texte.trim() ? 'primary' : 'border-strong'}
              alignItems="center"
              justifyContent="center"
            >
              <XStack style={{ transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }}>
                <Icone nom="send" taille={22} couleur="on-primary" />
              </XStack>
            </XStack>
          </Appui>
        </XStack>
      </KeyboardAvoidingView>
    </YStack>
  );
}
