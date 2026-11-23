import {
  type Avis,
  ajouterJours,
  dateLocale,
  donneesCreneaux,
  formatDistance,
  formatDuree,
  formatNote,
  formatPrix,
  formatPrixService,
  getFournisseur,
  getProfil,
  initiales,
  JOURS_RECHERCHE,
  libelleDispoDes,
  listerAvis,
  listerServices,
  nomCourt,
  preparerFournisseurs,
  type Service,
  textes,
  versUtc,
} from '@fixa/core';
import { Bouton, EtatVide, Etoiles, ICONES, Icone, type NomIcone, Texte } from '@fixa/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { Query } from 'react-native-appwrite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { BoutonRetour, CadreLateral, useHaut } from '../../composants/Ecran';
import { ErreurChargement } from '../../composants/Section';
import { tables } from '../../lib/appwrite';
import { couleurDe, lireCategories, lireProfil, positionDe, useLecture } from '../../lib/donnees';
import { useSession } from '../../lib/session';

const t = textes.recherche.profil;
const NB_AVIS = 3;
const COULEURS_AVIS = ['cat2', 'cat4', 'cat5', 'cat3', 'cat6', 'cat1'] as const;

function Stat({ valeur, libelle, icone }: { valeur: string; libelle: string; icone?: ReactNode }) {
  return (
    <YStack
      flex={1}
      paddingVertical="3"
      paddingHorizontal={6}
      borderRadius={20}
      backgroundColor="surface"
      alignItems="center"
      gap={3}
    >
      <XStack gap="1" alignItems="center">
        {icone}
        <Texte fontSize={17} fontWeight="600">
          {valeur}
        </Texte>
      </XStack>
      <Texte fontSize="2" color="color-muted" numberOfLines={1}>
        {libelle}
      </Texte>
    </YStack>
  );
}

function LigneService({ service, premiere }: { service: Service; premiere: boolean }) {
  return (
    <XStack
      paddingVertical={14}
      gap="3"
      alignItems="center"
      borderTopWidth={premiere ? 0 : 1}
      borderColor="border-color"
    >
      <YStack flex={1} gap={3}>
        <Texte fontSize={15} fontWeight="500">
          {service.titre}
        </Texte>
        <Texte fontSize="3" color="color-muted">
          {formatDuree(service.duree)}
        </Texte>
      </YStack>
      <Texte fontSize={15} fontWeight="600">
        {formatPrixService(service)}
      </Texte>
    </XStack>
  );
}

function CarteAvis({ avis, couleur }: { avis: Avis; couleur: string }) {
  return (
    <YStack padding="4" borderRadius="5" backgroundColor="surface" gap={10}>
      <XStack gap={10} alignItems="center">
        <XStack
          width={40}
          height={40}
          borderRadius="round"
          backgroundColor={`${couleur}-soft`}
          alignItems="center"
          justifyContent="center"
        >
          <Texte fontSize="4" fontWeight="600" color={couleur}>
            {initiales(avis.clientNom)}
          </Texte>
        </XStack>
        <YStack flex={1} gap={2}>
          <Texte fontSize={15} fontWeight="600">
            {nomCourt(avis.clientNom)}
          </Texte>
          <Texte fontSize="2" color="color-muted" numberOfLines={1}>
            {avis.serviceTitre}
          </Texte>
        </YStack>
        <Etoiles note={avis.note} libelle={textes.commun.surCinq(avis.note)} taille={15} />
      </XStack>
      {avis.commentaire ? (
        <Texte fontSize={15} lineHeight="22px">
          {avis.commentaire}
        </Texte>
      ) : null}
    </YStack>
  );
}

function Titre({ children }: { children: string }) {
  return (
    <Texte fontSize="6" fontWeight="600">
      {children}
    </Texte>
  );
}

// The provider profile. Sur devis services stay out of the list, as their price says nothing yet.
function ProfilPro() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const top = useHaut();
  const { utilisateur } = useSession();
  const uid = utilisateur?.id ?? null;

  const lecture = useLecture(`pro:${id}:${uid}`, async () => {
    const maintenant = new Date();
    const depuis = maintenant.toISOString();
    const jusqua = versUtc(ajouterJours(dateLocale(depuis), JOURS_RECHERCHE), '00:00');
    const [fournisseur, profil, services, avis, creneaux, categories, moi] = await Promise.all([
      getFournisseur(tables, id),
      getProfil(tables, id),
      listerServices(tables, Query, [id]),
      listerAvis(tables, Query, id, NB_AVIS),
      donneesCreneaux(tables, Query, [id], depuis, jusqua),
      lireCategories(),
      uid ? lireProfil(uid) : null,
    ]);
    if (!fournisseur?.visible) return null;
    const [pro] = preparerFournisseurs({
      fournisseurs: [fournisseur],
      services,
      creneaux,
      specialites: profil?.specialites[0] ? { [id]: profil.specialites[0] } : {},
      position: positionDe(moi),
      maintenant,
    });
    return pro ? { pro, profil, services, avis, categories, maintenant } : null;
  });
  const d = lecture.donnees;

  const prendreRdv = () => {
    if (!utilisateur) router.push('/connexion');
    else router.push({ pathname: '/reserver/[fournisseurId]', params: { fournisseurId: id } });
  };

  if (!d) {
    return (
      <YStack
        flex={1}
        backgroundColor="background"
        paddingTop={top + 8}
        paddingHorizontal="5"
        gap="5"
      >
        <BoutonRetour onPress={() => router.back()} />
        {lecture.erreur ? <ErreurChargement onReessayer={lecture.recharger} /> : null}
        {!lecture.chargement && !lecture.erreur ? (
          <EtatVide icone="person_search" titre={t.introuvable} texte="" />
        ) : null}
      </YStack>
    );
  }

  const { pro, profil, avis, maintenant } = d;
  const couleur = couleurDe(d.categories, pro.categorieId);
  const icone = d.categories.find((c) => c.$id === pro.categorieId)?.icone ?? '';
  const couverture: NomIcone = icone in ICONES ? (icone as NomIcone) : 'handyman';
  const services = d.services.filter((s) => s.typePrix !== 'SUR_DEVIS');
  const sousTitre = [pro.specialite, pro.ville].filter(Boolean).join(' · ');

  return (
    <YStack flex={1} backgroundColor="background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <XStack
          height={290}
          backgroundColor={`${couleur}-soft`}
          alignItems="center"
          justifyContent="center"
        >
          <Icone nom={couverture} taille={72} couleur={couleur} />
        </XStack>
        <YStack
          marginTop={-32}
          borderTopStartRadius={32}
          borderTopEndRadius={32}
          backgroundColor="background"
          paddingTop={22}
          paddingHorizontal="5"
          paddingBottom={150}
          gap="6"
        >
          <XStack gap="4" alignItems="center">
            <XStack
              width={76}
              height={76}
              borderRadius={26}
              backgroundColor={`${couleur}-soft`}
              alignItems="center"
              justifyContent="center"
            >
              <Texte fontSize={26} fontWeight="600" color={couleur}>
                {initiales(pro.nom)}
              </Texte>
            </XStack>
            <YStack flex={1} gap={5}>
              <XStack gap={6} alignItems="center">
                <Texte fontSize={22} fontWeight="600" letterSpacing={-0.22} flexShrink={1}>
                  {pro.nom}
                </Texte>
                {pro.statutVerification === 'VALIDE' ? (
                  <Icone nom="verified_fill" taille={20} couleur="secondary" />
                ) : null}
              </XStack>
              <Texte fontSize="4" color="color-muted">
                {sousTitre}
              </Texte>
              {pro.prochainCreneau ? (
                <XStack
                  alignSelf="flex-start"
                  height={26}
                  paddingStart={6}
                  paddingEnd={10}
                  gap="1"
                  borderRadius="round"
                  backgroundColor="completed-soft"
                  alignItems="center"
                >
                  <Icone nom="bolt" taille={15} couleur="completed" />
                  <Texte fontSize="2" fontWeight="500" color="completed">
                    {libelleDispoDes(pro.prochainCreneau, maintenant)}
                  </Texte>
                </XStack>
              ) : null}
            </YStack>
          </XStack>

          <XStack gap={10}>
            <Stat
              valeur={formatNote(pro.noteMoyenne)}
              libelle={t.avis(pro.nbAvis)}
              icone={<Icone nom="star_fill" taille={18} couleur="star" />}
            />
            <Stat
              valeur={pro.distanceKm === null ? pro.ville : formatDistance(pro.distanceKm)}
              libelle={pro.distanceKm === null ? textes.recherche.filtres.ville : pro.ville}
            />
            <Stat valeur={String(services.length)} libelle={t.services(services.length)} />
          </XStack>

          <YStack gap="3">
            <Titre>{t.titreServices}</Titre>
            <YStack
              borderRadius="5"
              backgroundColor="surface"
              paddingHorizontal="4"
              paddingVertical={2}
            >
              {services.map((s, i) => (
                <LigneService key={s.$id} service={s} premiere={i === 0} />
              ))}
            </YStack>
            <XStack gap="2" alignItems="flex-start">
              <Icone nom="info" taille={17} couleur="color-muted" />
              <Texte flex={1} fontSize="3" lineHeight="19px" color="color-muted">
                {t.prixIndicatifs}
              </Texte>
            </XStack>
          </YStack>

          {profil?.description ? (
            <YStack gap="2">
              <Titre>{t.aPropos}</Titre>
              <Texte fontSize={15} lineHeight="23px" color="color-muted">
                {profil.description}
              </Texte>
            </YStack>
          ) : null}

          <YStack gap="3">
            <Titre>{t.titreAvis}</Titre>
            <XStack
              paddingVertical="4"
              paddingHorizontal="5"
              borderRadius="5"
              backgroundColor="surface"
              gap="4"
              alignItems="center"
            >
              <Texte fontSize={40} lineHeight="44px" fontWeight="600">
                {formatNote(pro.noteMoyenne)}
              </Texte>
              <YStack gap={5}>
                <Etoiles
                  note={pro.noteMoyenne}
                  libelle={textes.commun.surCinq(formatNote(pro.noteMoyenne))}
                  taille={14}
                />
                <Texte fontSize="2" color="color-muted">
                  {t.avis(pro.nbAvis)}
                </Texte>
              </YStack>
            </XStack>
            {avis.length === 0 && pro.nbAvis === 0 ? (
              <Texte fontSize="4" color="color-muted">
                {t.aucunAvis}
              </Texte>
            ) : (
              avis.map((a, i) => (
                <CarteAvis
                  key={a.$id}
                  avis={a}
                  couleur={COULEURS_AVIS[i % COULEURS_AVIS.length] ?? 'cat1'}
                />
              ))
            )}
          </YStack>
        </YStack>
      </ScrollView>

      <XStack position="absolute" top={top + 8} start={16}>
        <XStack
          role="button"
          aria-label={textes.commun.retour}
          width={44}
          height={44}
          borderRadius="round"
          backgroundColor="surface press:background-press"
          alignItems="center"
          justifyContent="center"
          shadowColor="shadow-color"
          shadowOffset={{ width: 0, height: 1 }}
          shadowRadius={3}
          onPress={() => router.back()}
        >
          <Icone nom="arrow_back" taille={22} />
        </XStack>
      </XStack>

      <XStack
        position="absolute"
        bottom={0}
        start={0}
        end={0}
        paddingTop={14}
        paddingHorizontal="5"
        paddingBottom={Math.max(bottom, 14) + 8}
        gap="4"
        alignItems="center"
        backgroundColor="surface"
        borderTopWidth={1}
        borderColor="border-color"
      >
        {pro.prixMin !== null ? (
          <YStack gap={2}>
            <Texte fontSize="2" color="color-muted">
              {t.aPartirDe}
            </Texte>
            <Texte fontSize="7" fontWeight="600">
              {formatPrix(pro.prixMin)}
            </Texte>
          </YStack>
        ) : null}
        <YStack flex={1}>
          <Bouton taille="lg" icone="calendar_add_on" onPress={prendreRdv}>
            {t.prendreRdv}
          </Bouton>
        </YStack>
      </XStack>
    </YStack>
  );
}

export default function EcranProfilPro() {
  return (
    <CadreLateral>
      <ProfilPro />
    </CadreLateral>
  );
}
