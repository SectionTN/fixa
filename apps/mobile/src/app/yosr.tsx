import {
  adresseManquante,
  ajouterJours,
  analyserMessage,
  type Categorie,
  type CreneauxFournisseur,
  dateLocale,
  donneesCreneaux,
  type FournisseurAffiche,
  formatDuree,
  formatPrixService,
  getProfil,
  heureLocale,
  JOURS_RECHERCHE,
  jourCourtLocal,
  jourLocal,
  LONGUEUR_MAX,
  listerServices,
  normaliserMessage,
  prochainsCreneaux,
  type Service,
  textes,
  trierFournisseurs,
  versUtc,
  villeCitee,
} from '@fixa/core';
import { Bouton, Icone, type NomIcone, Puce, Texte } from '@fixa/ui';
import { useRouter } from 'expo-router';
import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { I18nManager, Platform, ScrollView, TextInput } from 'react-native';
import { Query } from 'react-native-appwrite';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { CartePro } from '../composants/CartePro';
import { BoutonRetour } from '../composants/Ecran';
import { Appui, entreeDouce, PointsEcriture } from '../composants/Mouvement';
import { useCouleur } from '../composants/Onglet';
import { VisageYosr } from '../composants/VisageYosr';
import { api } from '../lib/api';
import { tables } from '../lib/appwrite';
import {
  chargerFournisseurs,
  couleurDe,
  lireCategories,
  lireProfil,
  positionDe,
} from '../lib/donnees';
import { ecouterRendezVous } from '../lib/enDirect';
import { useSession } from '../lib/session';
import { vibrer } from '../lib/vibrer';

const t = textes.yosr;
const PAUSE = 650;

type Choix = {
  libelle: string;
  action:
    | 'urgence'
    | 'trouver'
    | 'rdv'
    | 'categorie'
    | 'tous'
    | 'reserver'
    | 'service'
    | 'creneau'
    | 'autres'
    | 'connexion'
    | 'ouvrirReservation';
  id?: string;
  /** The pro's name, for a booking chip. */
  nom?: string;
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
    }
  | { id: number; de: 'recap'; proNom: string; service: Service; debut: string; adresse: string };

// A booking Yosr is putting together, from the pro's chip to the summary card.
type Reservation = {
  proId: string;
  proNom: string;
  services: Service[];
  creneaux: CreneauxFournisseur;
  adresse: string;
  service: Service | null;
};

const AUCUN_CRENEAU: CreneauxFournisseur = { disponibilites: [], conges: [], occupees: [] };

// The booking window the booking screen reads: from now to the end of the seventh day.
function fenetre() {
  const depuis = new Date().toISOString();
  return { depuis, jusqua: versUtc(ajouterJours(dateLocale(depuis), JOURS_RECHERCHE), '00:00') };
}

// The pro's services, the one the conversation talks about first ("fuite" puts the leak repair on top).
function parPertinence(services: Service[], dits: string[]): Service[] {
  const fil = normaliserMessage(dits.join(' '));
  const score = (s: Service) =>
    normaliserMessage(s.titre)
      .split(' ')
      .filter((mot) => mot.length >= 4 && fil.includes(mot.slice(0, 5))).length;
  return [...services].sort((a, b) => score(b) - score(a));
}
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

function LigneRecap({ icone, texte }: { icone: NomIcone; texte: string }) {
  return (
    <XStack gap="3" alignItems="center">
      <XStack
        width={32}
        height={32}
        borderRadius={10}
        backgroundColor="background-soft"
        alignItems="center"
        justifyContent="center"
      >
        <Icone nom={icone} taille={18} couleur="color-muted" />
      </XStack>
      <Texte flex={1} fontSize="4">
        {texte}
      </Texte>
    </XStack>
  );
}

// The booking summary in the chat, with Modifier and Confirmer while it is the last message.
function Recap({
  m,
  actif,
  onModifier,
  onConfirmer,
}: {
  m: Extract<Message, { de: 'recap' }>;
  actif: boolean;
  onModifier: () => void;
  onConfirmer: () => void;
}) {
  return (
    <YStack
      marginStart={36}
      backgroundColor="surface"
      borderWidth={1}
      borderColor="border-color"
      borderRadius={22}
      padding="4"
      gap="3"
    >
      <Texte fontSize="5" fontWeight="600">
        {t.recap}
      </Texte>
      <LigneRecap icone="person" texte={m.proNom} />
      <LigneRecap icone="handyman" texte={`${m.service.titre} · ${formatDuree(m.service.duree)}`} />
      <LigneRecap
        icone="calendar_month"
        texte={t.creneau(jourLocal(m.debut), heureLocale(m.debut))}
      />
      {m.service.aDomicile && m.adresse ? (
        <LigneRecap icone="location_on" texte={m.adresse} />
      ) : null}
      <LigneRecap icone="payments" texte={formatPrixService(m.service)} />
      {actif ? (
        <XStack gap="2" marginTop="1">
          <YStack flex={1}>
            <Bouton taille="sm" variante="outline" onPress={onModifier}>
              {t.modifier}
            </Bouton>
          </YStack>
          <YStack flex={1}>
            <Bouton taille="sm" onPress={onConfirmer}>
              {t.confirmer}
            </Bouton>
          </YStack>
        </XStack>
      ) : null}
    </YStack>
  );
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
  const resa = useRef<Reservation | null>(null);
  const categorieFil = useRef<string | null>(null);
  // The request Yosr sent, so its answer can land in the chat.
  const attendu = useRef<{ id: string; nom: string } | null>(null);
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
    categorieFil.current = categorieId;
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
          choix: [
            ...pros.slice(0, 1).map(
              (p): Choix => ({
                libelle: t.reserverAvec(p.nom),
                action: 'reserver',
                id: p.$id,
                nom: p.nom,
              }),
            ),
            { libelle: t.voirTous, action: 'tous', id: categorieId },
          ],
        },
      ]);
    } catch {
      await repondre([{ de: 'yosr', texte: t.erreur }]);
    }
  };

  // The next free starts for the chosen service, as chips.
  const proposerCreneaux = async (intro?: string) => {
    const r = resa.current;
    if (!r?.service) return;
    const debuts = prochainsCreneaux({
      dureeMin: r.service.duree,
      creneaux: r.creneaux,
      maintenant: new Date(),
      nombre: 4,
      parJour: 2,
    });
    if (debuts.length === 0) {
      await repondre([
        {
          de: 'yosr',
          texte: t.aucunCreneau(r.proNom),
          choix: [{ libelle: t.autresPros, action: 'autres' }],
        },
      ]);
      return;
    }
    await repondre([
      {
        de: 'yosr',
        texte: intro ?? t.quelCreneau,
        choix: debuts.map((d) => ({
          libelle: t.creneau(jourCourtLocal(d), heureLocale(d)),
          action: 'creneau',
          id: d,
        })),
      },
    ]);
  };

  // Reads the pro's services, free slots and the client's address, then asks for the service.
  const commencerReservation = async (proId: string, proNom: string) => {
    if (!utilisateur) {
      await repondre([
        {
          de: 'yosr',
          texte: t.connexion,
          choix: [{ libelle: t.seConnecter, action: 'connexion' }],
        },
      ]);
      return;
    }
    try {
      const { depuis, jusqua } = fenetre();
      const [services, creneaux, moi] = await Promise.all([
        listerServices(tables, Query, [proId]),
        donneesCreneaux(tables, Query, [proId], depuis, jusqua),
        getProfil(tables, utilisateur.id),
      ]);
      const reservables = parPertinence(
        services.filter((s) => s.typePrix !== 'SUR_DEVIS'),
        dits.current,
      );
      resa.current = {
        proId,
        proNom,
        services: reservables,
        creneaux: creneaux[proId] ?? AUCUN_CRENEAU,
        adresse: moi?.adresse ?? '',
        service: reservables.length === 1 ? (reservables[0] ?? null) : null,
      };
      if (reservables.length === 0) {
        await repondre([
          {
            de: 'yosr',
            texte: t.aucunCreneau(proNom),
            choix: [{ libelle: t.autresPros, action: 'autres' }],
          },
        ]);
        return;
      }
      if (resa.current.service) {
        await proposerCreneaux();
        return;
      }
      await repondre([
        {
          de: 'yosr',
          texte: t.quelService,
          choix: reservables
            .slice(0, 4)
            .map((s) => ({ libelle: s.titre, action: 'service', id: s.$id })),
        },
      ]);
    } catch {
      await repondre([{ de: 'yosr', texte: t.erreur }]);
    }
  };

  // The summary card, unless an at-home service still needs an address.
  const recapituler = async (debut: string) => {
    const r = resa.current;
    if (!r?.service) return;
    if (adresseManquante(r.service, r.adresse)) {
      await repondre([
        {
          de: 'yosr',
          texte: t.sansAdresse,
          choix: [{ libelle: t.ouvrirReservation, action: 'ouvrirReservation', id: r.proId }],
        },
      ]);
      return;
    }
    await repondre([
      { de: 'recap', proNom: r.proNom, service: r.service, debut, adresse: r.adresse },
    ]);
  };

  // Sends the request as the booking screen does, then waits for the pro's answer in the chat.
  const confirmer = async (m: Extract<Message, { de: 'recap' }>) => {
    const r = resa.current;
    if (!r) return;
    vibrer.selection();
    setEcrit(true);
    const reponse = await api<{ rendezVousId: string }>('/rendez-vous', {
      fournisseurId: r.proId,
      serviceId: m.service.$id,
      debut: m.debut,
      adresse: m.service.aDomicile ? m.adresse.trim() : '',
      // What the client wrote about the need, without the greetings and thanks.
      description: dits.current
        .filter((d) => analyserMessage(d).intention === null)
        .join(' · ')
        .slice(0, LONGUEUR_MAX.description),
    });
    setEcrit(false);
    if (reponse.ok) {
      vibrer.succes();
      attendu.current = { id: reponse.data.rendezVousId, nom: r.proNom };
      ajouter({
        de: 'yosr',
        texte: t.envoye(r.proNom),
        choix: [{ libelle: t.choixRdv, action: 'rdv' }],
      });
      return;
    }
    if (reponse.code === 'CRENEAU_PRIS') {
      const { depuis, jusqua } = fenetre();
      const creneaux = await donneesCreneaux(tables, Query, [r.proId], depuis, jusqua).catch(
        () => null,
      );
      if (creneaux) r.creneaux = creneaux[r.proId] ?? AUCUN_CRENEAU;
      await proposerCreneaux(t.creneauPris);
      return;
    }
    ajouter({ de: 'yosr', texte: reponse.message });
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
    if (c.action === 'connexion') {
      router.back();
      router.push('/connexion');
      return;
    }
    if (c.action === 'ouvrirReservation' && c.id) {
      router.back();
      router.push({ pathname: '/reserver/[fournisseurId]', params: { fournisseurId: c.id } });
      return;
    }
    ajouter({ de: 'moi', texte: c.libelle });
    if (c.action === 'urgence') {
      urgence.current = true;
      await repondre([{ de: 'yosr', texte: t.questionUrgence }]);
    } else if (c.action === 'trouver') {
      await repondre([{ de: 'yosr', texte: t.questionService, choix: await choixCategories() }]);
    } else if (c.action === 'reserver' && c.id) {
      await commencerReservation(c.id, c.nom ?? '');
    } else if (c.action === 'service' && c.id && resa.current) {
      resa.current.service = resa.current.services.find((s) => s.$id === c.id) ?? null;
      await proposerCreneaux();
    } else if (c.action === 'creneau' && c.id) {
      await recapituler(c.id);
    } else if (c.action === 'autres') {
      if (categorieFil.current) await chercher(categorieFil.current);
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

  // The pro's answer to the request Yosr sent lands in the chat, the banner sits behind this modal.
  useEffect(
    () =>
      ecouterRendezVous((rdv) => {
        const a = attendu.current;
        if (!a || rdv.$id !== a.id) return;
        if (rdv.statut === 'CONFIRME') {
          attendu.current = null;
          ajouter({
            de: 'yosr',
            texte: t.confirmeChat(a.nom),
            choix: [{ libelle: t.choixRdv, action: 'rdv' }],
          });
        } else if (rdv.statut === 'REFUSE') {
          attendu.current = null;
          ajouter({
            de: 'yosr',
            texte: t.refuseChat(a.nom),
            choix: [{ libelle: t.autresPros, action: 'autres' }],
          });
        }
      }),
    [],
  );

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
              ) : m.de === 'recap' ? (
                <Recap
                  m={m}
                  actif={m === dernier}
                  onModifier={() => seul(() => proposerCreneaux())}
                  onConfirmer={() => seul(() => confirmer(m))}
                />
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
