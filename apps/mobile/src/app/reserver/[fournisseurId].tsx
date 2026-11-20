import {
  ajouterJours,
  type Creneau,
  creneauxDuJour,
  dateLocale,
  donneesCreneaux,
  formatDuree,
  formatNote,
  formatPrixService,
  fr,
  getFournisseur,
  getProfil,
  heureLocale,
  initiales,
  JOURS_RECHERCHE,
  jourCourtLocal,
  jourLocal,
  joursReservation,
  LONGUEUR_MAX,
  listerServices,
  parMoment,
  type Service,
  versUtc,
} from '@fixa/core';
import {
  BadgeStatut,
  Bouton,
  ChampTexte,
  Etapes,
  EtatVide,
  ICONES,
  Icone,
  type NomIcone,
  PuceCreneau,
  Texte,
} from '@fixa/ui';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, useWindowDimensions } from 'react-native';
import { Query } from 'react-native-appwrite';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { BoutonRetour, CadreLateral, useHaut } from '../../composants/Ecran';
import { ErreurChargement } from '../../composants/Section';
import { api } from '../../lib/api';
import { tables } from '../../lib/appwrite';
import { couleurDe, lireCategories, useLecture } from '../../lib/donnees';
import { useSession } from '../../lib/session';

const t = fr.reservation;
const MARGE = 20;
const ECART_PUCES = 10;
const ECART_JOURS = 8;
const AUCUN_CRENEAU = { disponibilites: [], conges: [], occupees: [] };

const majuscule = (texte: string) => `${texte.charAt(0).toUpperCase()}${texte.slice(1)}`;

function CarteService({
  service,
  choisi,
  onPress,
}: {
  service: Service;
  choisi: boolean;
  onPress: () => void;
}) {
  return (
    <XStack
      role="radio"
      accessible
      aria-checked={choisi}
      aria-label={`${service.titre}, ${formatDuree(service.duree)}, ${formatPrixService(service)}`}
      paddingVertical={14}
      paddingHorizontal="4"
      gap={14}
      borderRadius={20}
      borderWidth={2}
      borderColor={choisi ? 'primary' : 'border-color'}
      backgroundColor="surface press:background-press"
      alignItems="center"
      onPress={onPress}
    >
      <XStack
        width={22}
        height={22}
        borderRadius="round"
        borderWidth={choisi ? 7 : 2}
        borderColor={choisi ? 'primary' : 'border-strong'}
      />
      <YStack flex={1} minWidth={0} gap={3}>
        <Texte fontSize={15} fontWeight="600" lineHeight="20px">
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

function TuileJour({
  jour,
  largeur,
  choisi,
  libre,
  onPress,
}: {
  jour: string;
  largeur: number;
  choisi: boolean;
  libre: boolean;
  onPress: () => void;
}) {
  const midi = versUtc(jour, '12:00');
  const [nom = '', numero = ''] = jourCourtLocal(midi).split(' ');
  const couleur = choisi ? 'on-primary' : libre ? 'color' : 'color-subtle';
  return (
    <YStack
      role="button"
      accessible
      aria-label={jourLocal(midi)}
      aria-selected={choisi}
      aria-disabled={!libre}
      width={largeur}
      // Seven tiles leave about 43 pt each, the gaps on both sides make up the 44 pt target.
      hitSlop={{ left: ECART_JOURS / 2, right: ECART_JOURS / 2 }}
      paddingVertical={10}
      borderRadius={18}
      borderWidth={choisi || !libre ? 0 : 1.5}
      borderColor="border-color"
      backgroundColor={choisi ? 'primary' : libre ? 'surface' : 'background-soft'}
      alignItems="center"
      gap={2}
      onPress={libre ? onPress : undefined}
    >
      <Texte fontSize="2" color={choisi ? 'on-primary' : 'color-muted'}>
        {nom.replace('.', '')}
      </Texte>
      <Texte fontSize="6" fontWeight="600" color={couleur}>
        {numero}
      </Texte>
      <YStack
        width={5}
        height={5}
        borderRadius="round"
        backgroundColor={libre ? (choisi ? 'on-primary' : 'completed') : 'transparent'}
      />
    </YStack>
  );
}

function GroupeCreneaux({
  titre,
  icone,
  creneaux,
  choisi,
  largeur,
  onChoisir,
}: {
  titre: string;
  icone: NomIcone;
  creneaux: Creneau[];
  choisi: string | null;
  largeur: number;
  onChoisir: (debut: string) => void;
}) {
  if (creneaux.length === 0) return null;
  return (
    <YStack gap="3">
      <XStack gap="2" alignItems="center">
        <Icone nom={icone} taille={20} couleur="color-muted" />
        <Texte fontSize="5" fontWeight="600">
          {titre}
        </Texte>
      </XStack>
      <XStack flexWrap="wrap" gap={ECART_PUCES}>
        {creneaux.map((c) => (
          <PuceCreneau
            key={c.debut}
            heure={heureLocale(c.debut)}
            etat={!c.libre ? 'pris' : c.debut === choisi ? 'choisi' : 'libre'}
            largeur={largeur}
            libellePris={t.dejaPris}
            onPress={() => onChoisir(c.debut)}
          />
        ))}
      </XStack>
    </YStack>
  );
}

function Ligne({
  icone,
  libelle,
  children,
  fin,
}: {
  icone: NomIcone;
  libelle: string;
  children: ReactNode;
  fin?: ReactNode;
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
      {fin}
    </XStack>
  );
}

// Booking in three steps on one screen, then the sent request. Back walks the steps before leaving.
function Reserver() {
  const { fournisseurId } = useLocalSearchParams<{ fournisseurId: string }>();
  const router = useRouter();
  const { bottom, left, right } = useSafeAreaInsets();
  const top = useHaut();
  // CadreLateral takes the side insets off, so the rows measure the width left between them.
  const width = useWindowDimensions().width - left - right;
  const { utilisateur } = useSession();
  const uid = utilisateur?.id ?? null;

  const [etape, setEtape] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [jourChoisi, setJourChoisi] = useState<string | null>(null);
  const [debut, setDebut] = useState<string | null>(null);
  const [adresse, setAdresse] = useState<string | null>(null);
  const [editionAdresse, setEditionAdresse] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState<{ debut: string; service: Service } | null>(null);
  const verrou = useRef(false);

  const lecture = useLecture(`reserver:${fournisseurId}:${uid}`, async () => {
    const maintenant = new Date();
    const depuis = maintenant.toISOString();
    const jusqua = versUtc(ajouterJours(dateLocale(depuis), JOURS_RECHERCHE), '00:00');
    const [fournisseur, profilPro, services, creneaux, categories, moi] = await Promise.all([
      getFournisseur(tables, fournisseurId),
      getProfil(tables, fournisseurId),
      listerServices(tables, Query, [fournisseurId]),
      donneesCreneaux(tables, Query, [fournisseurId], depuis, jusqua),
      lireCategories(),
      uid ? getProfil(tables, uid) : null,
    ]);
    if (!fournisseur?.visible) return null;
    return {
      fournisseur,
      specialite: profilPro?.specialites[0] ?? null,
      services: services.filter((s) => s.typePrix !== 'SUR_DEVIS'),
      creneaux: creneaux[fournisseurId] ?? AUCUN_CRENEAU,
      categories,
      adresse: moi?.adresse ?? '',
      maintenant,
    };
  });
  const d = lecture.donnees;

  const service = d?.services.find((s) => s.$id === serviceId) ?? d?.services[0] ?? null;
  const jours = useMemo(() => (d ? joursReservation(d.maintenant) : []), [d]);
  const parJour = useMemo(() => {
    if (!d || !service) return {} as Record<string, Creneau[]>;
    return Object.fromEntries(
      jours.map((jour) => [
        jour,
        creneauxDuJour({
          jour,
          dureeMin: service.duree,
          creneaux: d.creneaux,
          maintenant: d.maintenant,
        }),
      ]),
    ) as Record<string, Creneau[]>;
  }, [d, service, jours]);
  const aDuLibre = (jour: string) => parJour[jour]?.some((c) => c.libre) ?? false;
  // A day or a start that the chosen service no longer fits falls back instead of staying selected.
  const jour = jourChoisi && aDuLibre(jourChoisi) ? jourChoisi : (jours.find(aDuLibre) ?? null);
  const choisi =
    debut && jour && parJour[jour]?.some((c) => c.libre && c.debut === debut) ? debut : null;
  const adresseFinale = adresse ?? d?.adresse ?? '';

  const precedent = () => {
    if (verrou.current) return;
    setMessage(null);
    if (etape > 0) setEtape(etape - 1);
    else router.back();
  };

  // On the later steps Android back returns one step, after the request there is no step to return to.
  useEffect(() => {
    if (etape === 0 || envoye) return;
    const abonnement = BackHandler.addEventListener('hardwareBackPress', () => {
      if (verrou.current) return true;
      setMessage(null);
      setEtape((e) => e - 1);
      return true;
    });
    return () => abonnement.remove();
  }, [etape, envoye]);

  const confirmer = async () => {
    if (!service || !choisi || verrou.current) return;
    verrou.current = true;
    setEnvoi(true);
    setMessage(null);
    const r = await api<{ rendezVousId: string }>('/rendez-vous', {
      fournisseurId,
      serviceId: service.$id,
      debut: choisi,
      adresse: adresseFinale.trim(),
      description: description.trim(),
    });
    verrou.current = false;
    setEnvoi(false);
    if (r.ok) {
      setEnvoye({ debut: choisi, service });
      return;
    }
    setMessage(r.message);
    if (r.code === 'CRENEAU_PRIS') {
      setDebut(null);
      setEtape(1);
      lecture.recharger();
    }
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
          <EtatVide icone="person_search" titre={fr.recherche.profil.introuvable} texte="" />
        ) : null}
      </YStack>
    );
  }

  const { fournisseur } = d;

  if (envoye) {
    const midi = envoye.debut;
    return (
      <YStack
        flex={1}
        backgroundColor="background"
        paddingTop={top}
        paddingBottom={Math.max(bottom, 16) + 8}
        paddingHorizontal="5"
      >
        <Stack.Screen options={{ gestureEnabled: false }} />
        <YStack flex={1} justifyContent="center" alignItems="center" gap="5">
          <YStack
            width={124}
            height={124}
            borderRadius="round"
            backgroundColor="completed-soft"
            alignItems="center"
            justifyContent="center"
          >
            <YStack
              width={84}
              height={84}
              borderRadius="round"
              backgroundColor="completed"
              alignItems="center"
              justifyContent="center"
            >
              <Icone nom="check" taille={44} couleur="on-primary" />
            </YStack>
          </YStack>
          <YStack gap="2" alignItems="center">
            <Texte fontSize="9" fontWeight="600" textAlign="center">
              {t.envoyee}
            </Texte>
            <Texte fontSize="5" color="color-muted" textAlign="center" lineHeight="24px">
              {t.vaConfirmer(fournisseur.nom)}
            </Texte>
          </YStack>
          <XStack
            alignSelf="stretch"
            padding="4"
            gap="4"
            borderRadius="5"
            backgroundColor="surface"
            alignItems="center"
          >
            <YStack
              width={56}
              height={60}
              borderRadius={14}
              backgroundColor="primary-soft"
              alignItems="center"
              justifyContent="center"
            >
              <Texte fontSize="2" fontWeight="600" color="on-primary-soft">
                {jourCourtLocal(midi).split(' ')[0]?.replace('.', '').toUpperCase()}
              </Texte>
              <Texte fontSize="7" fontWeight="600" color="on-primary-soft">
                {jourCourtLocal(midi).split(' ')[1]}
              </Texte>
            </YStack>
            <YStack flex={1} gap={3}>
              <Texte fontSize="5" fontWeight="600" numberOfLines={1}>
                {fournisseur.nom}
              </Texte>
              <Texte fontSize="4" color="color-muted" numberOfLines={1}>
                {envoye.service.titre}
              </Texte>
              <XStack gap={5} alignItems="center">
                <Icone nom="schedule" taille={16} couleur="color-muted" />
                <Texte fontSize="3" color="color-muted">
                  {`${heureLocale(midi)} · ${fournisseur.ville}`}
                </Texte>
              </XStack>
              <YStack paddingTop={4}>
                <BadgeStatut statut="EN_ATTENTE" libelle={fr.statuts.EN_ATTENTE} />
              </YStack>
            </YStack>
          </XStack>
        </YStack>
        <Bouton taille="lg" onPress={() => router.dismissTo('/rendez-vous')}>
          {t.voirMesRdv}
        </Bouton>
      </YStack>
    );
  }

  const couleur = couleurDe(d.categories, fournisseur.categorieId);
  const nomIcone = d.categories.find((c) => c.$id === fournisseur.categorieId)?.icone ?? '';
  const iconeService: NomIcone = nomIcone in ICONES ? (nomIcone as NomIcone) : 'handyman';
  const largeurPuce = (width - 2 * MARGE - 3 * ECART_PUCES) / 4;
  const largeurJour = (width - 2 * MARGE - 6 * ECART_JOURS) / 7;
  const moments = parMoment(jour ? (parJour[jour] ?? []) : []);
  const moisAffiche = jour ? versUtc(jour, '12:00') : null;
  const sousTitre = [fournisseur.nom, d.specialite].filter(Boolean).join(' · ');

  const pied =
    etape === 0 ? (
      <>
        <YStack gap={2}>
          <Texte fontSize="3" color="color-muted">
            {t.totalEstime}
          </Texte>
          <Texte fontSize="7" fontWeight="600">
            {service ? formatPrixService(service) : '-'}
          </Texte>
        </YStack>
        <YStack flex={1}>
          <Bouton
            taille="lg"
            iconeFin="arrow_forward"
            desactive={!service}
            onPress={() => setEtape(1)}
          >
            {t.continuer}
          </Bouton>
        </YStack>
      </>
    ) : etape === 1 ? (
      <>
        <YStack gap={2}>
          <Texte fontSize="3" color="color-muted">
            {choisi ? jourCourtLocal(choisi) : '-'}
          </Texte>
          <Texte fontSize="7" fontWeight="600">
            {choisi ? heureLocale(choisi) : '--:--'}
          </Texte>
        </YStack>
        <YStack flex={1}>
          <Bouton
            taille="lg"
            iconeFin="arrow_forward"
            desactive={!choisi}
            onPress={() => setEtape(2)}
          >
            {t.continuer}
          </Bouton>
        </YStack>
      </>
    ) : (
      <YStack flex={1} gap="3">
        <XStack gap="2" justifyContent="center" alignItems="center">
          <Icone nom="event_upcoming" taille={18} couleur="color-muted" />
          <Texte fontSize="3" color="color-muted">
            {t.annulationGratuite}
          </Texte>
        </XStack>
        <Bouton taille="lg" desactive={!choisi || envoi} onPress={confirmer}>
          {t.confirmer}
        </Bouton>
      </YStack>
    );

  return (
    <YStack flex={1} backgroundColor="background">
      {/* iOS 26 swipes back from anywhere, which would leave the flow instead of going back a step. */}
      <Stack.Screen options={{ gestureEnabled: etape === 0 }} />
      <YStack paddingTop={top + 8} paddingHorizontal="5" gap="4">
        <XStack gap="3" alignItems="center">
          <BoutonRetour onPress={precedent} />
          <YStack flex={1}>
            <Texte fontSize="6" fontWeight="600">
              {t.titre}
            </Texte>
            <Texte fontSize="3" color="color-muted" numberOfLines={1}>
              {sousTitre}
            </Texte>
          </YStack>
        </XStack>
        <Etapes
          etapes={t.etapes}
          courante={etape}
          libelle={t.etapeSur(etape + 1, t.etapes.length, t.etapes[etape] ?? '')}
        />
      </YStack>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: MARGE, paddingTop: 20, paddingBottom: 24 }}
      >
        {message ? (
          <XStack
            marginBottom="4"
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

        {etape === 0 ? (
          <YStack gap="4">
            <Texte fontSize={22} fontWeight="600">
              {t.quelService}
            </Texte>
            <YStack gap={10} role="radiogroup">
              {d.services.map((s) => (
                <CarteService
                  key={s.$id}
                  service={s}
                  choisi={s.$id === service?.$id}
                  onPress={() => setServiceId(s.$id)}
                />
              ))}
            </YStack>
            <YStack marginTop="2">
              <ChampTexte
                libelle={t.decrivez}
                valeur={description}
                onChange={setDescription}
                placeholder={t.indiceDescription}
                maxLength={LONGUEUR_MAX.description}
                aide={t.compteur(description.length, LONGUEUR_MAX.description)}
                multiligne
              />
            </YStack>
          </YStack>
        ) : null}

        {etape === 1 ? (
          <YStack gap="5">
            {lecture.erreur ? <ErreurChargement onReessayer={lecture.recharger} /> : null}
            <Texte fontSize="7" fontWeight="600">
              {moisAffiche
                ? majuscule(`${fr.temps.mois[Number(jour?.slice(5, 7)) - 1]} ${jour?.slice(0, 4)}`)
                : t.aucunJour}
            </Texte>
            <XStack gap={ECART_JOURS}>
              {jours.map((j) => (
                <TuileJour
                  key={j}
                  jour={j}
                  largeur={largeurJour}
                  choisi={j === jour}
                  libre={aDuLibre(j)}
                  onPress={() => {
                    setJourChoisi(j);
                    setDebut(null);
                  }}
                />
              ))}
            </XStack>
            {jour ? (
              <>
                <GroupeCreneaux
                  titre={t.matin}
                  icone="wb_sunny"
                  creneaux={moments.matin}
                  choisi={choisi}
                  largeur={largeurPuce}
                  onChoisir={setDebut}
                />
                <GroupeCreneaux
                  titre={t.apresMidi}
                  icone="wb_twilight"
                  creneaux={moments.apresMidi}
                  choisi={choisi}
                  largeur={largeurPuce}
                  onChoisir={setDebut}
                />
              </>
            ) : null}
          </YStack>
        ) : null}

        {etape === 2 && service && choisi ? (
          <YStack gap="4">
            <Texte fontSize={22} fontWeight="600">
              {t.verifiez}
            </Texte>
            <YStack
              paddingHorizontal="4"
              paddingTop={14}
              paddingBottom="1"
              borderRadius="5"
              backgroundColor="surface"
            >
              <XStack gap="3" alignItems="center" paddingBottom="3">
                <XStack
                  width={48}
                  height={48}
                  borderRadius="4"
                  backgroundColor={`${couleur}-soft`}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Texte fontSize="5" fontWeight="600" color={couleur}>
                    {initiales(fournisseur.nom)}
                  </Texte>
                </XStack>
                <YStack flex={1} gap={2}>
                  <Texte fontSize="5" fontWeight="600" numberOfLines={1}>
                    {fournisseur.nom}
                  </Texte>
                  <XStack gap={5} alignItems="center">
                    {d.specialite ? (
                      <Texte fontSize="3" color="color-muted">
                        {`${d.specialite} ·`}
                      </Texte>
                    ) : null}
                    <Icone nom="star_fill" taille={14} couleur="star" />
                    <Texte fontSize="3" color="color-muted">
                      {formatNote(fournisseur.noteMoyenne)}
                    </Texte>
                  </XStack>
                </YStack>
              </XStack>
              <YStack height={1} backgroundColor="border-color" />
              <Ligne icone={iconeService} libelle={t.service}>
                <Texte fontSize={15} fontWeight="500">
                  {`${service.titre} · ${formatDuree(service.duree)}`}
                </Texte>
              </Ligne>
              <YStack height={1} backgroundColor="border-color" />
              <Ligne icone="calendar_month" libelle={t.dateHeure}>
                <Texte fontSize={15} fontWeight="500">
                  {`${majuscule(jourLocal(choisi))} · ${heureLocale(choisi)}`}
                </Texte>
              </Ligne>
              <YStack height={1} backgroundColor="border-color" />
              <Ligne
                icone="location_on"
                libelle={t.adresse}
                fin={
                  editionAdresse ? null : (
                    <Texte
                      role="button"
                      fontSize="4"
                      fontWeight="500"
                      color="primary"
                      hitSlop={12}
                      onPress={() => setEditionAdresse(true)}
                    >
                      {t.modifier}
                    </Texte>
                  )
                }
              >
                {editionAdresse ? null : (
                  <Texte
                    fontSize={15}
                    fontWeight="500"
                    color={adresseFinale ? 'color' : 'color-subtle'}
                  >
                    {adresseFinale || t.adresseVide}
                  </Texte>
                )}
              </Ligne>
              {editionAdresse ? (
                <YStack paddingBottom="3">
                  <ChampTexte
                    libelle={t.adresse}
                    valeur={adresseFinale}
                    onChange={setAdresse}
                    placeholder={t.indiceAdresse}
                    maxLength={LONGUEUR_MAX.adresse}
                    autoComplete="street-address"
                    textContentType="fullStreetAddress"
                    returnKeyType="done"
                    onSubmitEditing={() => setEditionAdresse(false)}
                  />
                </YStack>
              ) : null}
            </YStack>
            <YStack
              paddingVertical={14}
              paddingHorizontal="4"
              gap={10}
              borderRadius="5"
              backgroundColor="surface"
            >
              <XStack justifyContent="space-between" alignItems="center">
                <Texte fontSize={17} fontWeight="600">
                  {t.totalEstime}
                </Texte>
                <Texte fontSize={17} fontWeight="600">
                  {formatPrixService(service)}
                </Texte>
              </XStack>
              <Texte fontSize="3" lineHeight="19px" color="color-muted">
                {t.payeSurPlace}
              </Texte>
            </YStack>
          </YStack>
        ) : null}
      </KeyboardAwareScrollView>

      <XStack
        paddingTop="4"
        paddingHorizontal="5"
        paddingBottom={Math.max(bottom, 16) + 8}
        gap="5"
        alignItems="center"
        borderTopWidth={1}
        borderColor="border-color"
        backgroundColor="surface"
      >
        {pied}
      </XStack>
    </YStack>
  );
}

export default function EcranReserver() {
  return (
    <CadreLateral>
      <Reserver />
    </CadreLateral>
  );
}
