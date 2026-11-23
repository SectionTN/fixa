import {
  type ActionClient,
  actionsRendezVous,
  blocDateLocal,
  classerMesRendezVous,
  estAVenir,
  formatPrixService,
  heureLocale,
  infoRendezVous,
  type MesRendezVous,
  type RendezVousLu,
  statutAffiche,
  textes,
} from '@fixa/core';
import {
  type ActionCarteRendezVous,
  BadgeStatut,
  CarteRendezVous,
  EtatVide,
  Segments,
  Texte,
} from '@fixa/ui';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';
import { BORDS_ECRAN, Ecran, MARGE_HAUT_MIN } from '../../composants/Ecran';
import { useBasOnglets } from '../../composants/Onglet';
import { ErreurChargement } from '../../composants/Section';
import { useMesRendezVous } from '../../lib/mesRendezVous';
import { useSession } from '../../lib/session';

const t = textes.rendezVous;
const v = textes.auth.visiteur;
type Vue = 'aVenir' | 'passes';

export default function RendezVous() {
  const { utilisateur } = useSession();
  const router = useRouter();
  if (utilisateur) return <Liste uid={utilisateur.id} />;
  return (
    <Ecran paddingTop="2" paddingHorizontal="5" gap="5">
      <Texte fontSize="9" fontWeight="600">
        {t.titre}
      </Texte>
      <YStack flex={1} justifyContent="center" paddingBottom="9">
        <EtatVide
          icone="event_upcoming"
          titre={v.rdvTitre}
          texte={v.rdvTexte}
          action={{ libelle: v.seConnecter, onPress: () => router.push('/connexion') }}
        />
      </YStack>
    </Ecran>
  );
}

// The card's buttons, in the order core lists the actions.
function actions(
  rdv: RendezVousLu,
  liste: ActionClient[],
  d: MesRendezVous,
  aller: (href: Href) => void,
): ActionCarteRendezVous[] {
  const categorie = d.pros[rdv.fournisseurId]?.categorieId;
  const boutons: Record<ActionClient, ActionCarteRendezVous> = {
    annuler: {
      libelle: t.annuler,
      variante: 'danger',
      onPress: () => aller(`/rendez-vous/${rdv.$id}/annuler`),
    },
    avis: {
      libelle: t.laisserAvis,
      variante: 'soft',
      icone: 'star',
      onPress: () => aller(`/rendez-vous/${rdv.$id}/avis`),
    },
    reserverANouveau: {
      libelle: t.reserverANouveau,
      variante: 'outline',
      onPress: () => aller(`/reserver/${rdv.fournisseurId}`),
    },
    reserverAilleurs: {
      libelle: t.reserverAilleurs,
      variante: 'outline',
      onPress: () => aller(categorie ? `/categorie/${categorie}` : '/'),
    },
  };
  return liste.map((a) => boutons[a]);
}

// The client's appointments, upcoming or past, kept current by the live booking updates.
function Liste({ uid }: { uid: string }) {
  const router = useRouter();
  const lecture = useMesRendezVous(uid);
  const bas = useBasOnglets();
  const d = lecture.donnees;
  const [vue, setVue] = useState<Vue>('aVenir');
  const dejaVu = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (dejaVu.current) lecture.recharger();
      dejaVu.current = true;
    }, [lecture.recharger]),
  );

  const classes = useMemo(() => (d ? classerMesRendezVous(d.liste, d.maintenant) : null), [d]);
  const sections = classes?.[vue] ?? [];
  const nbAVenir = classes?.aVenir.reduce((n, s) => n + s.rendezVous.length, 0) ?? 0;

  return (
    <YStack flex={1} backgroundColor="background">
      <SafeAreaView edges={BORDS_ECRAN} style={{ flex: 1, paddingTop: MARGE_HAUT_MIN }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: 20 + bas,
            gap: 14,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={lecture.recharger} />}
        >
          <Texte fontSize="9" fontWeight="600">
            {t.titre}
          </Texte>
          <Segments
            options={[
              { valeur: 'aVenir', libelle: t.aVenir, compte: nbAVenir },
              { valeur: 'passes', libelle: t.passes },
            ]}
            valeur={vue}
            onChange={setVue}
          />
          {lecture.erreur && !d ? <ErreurChargement onReessayer={lecture.recharger} /> : null}

          {d
            ? sections.map((s) => (
                <YStack key={s.titre} gap={14}>
                  <Texte fontSize="3" fontWeight="500" color="color-muted" paddingStart={4}>
                    {s.titre}
                  </Texte>
                  {s.rendezVous.map((rdv) => {
                    const passe = !estAVenir(rdv, d.maintenant);
                    const statut = statutAffiche(rdv, d.maintenant);
                    const lieu = rdv.adresse?.trim() || d.pros[rdv.fournisseurId]?.ville;
                    const note = rdv.aAvis ? d.notes[rdv.$id] : undefined;
                    const date = blocDateLocal(rdv.debut);
                    return (
                      <CarteRendezVous
                        key={rdv.$id}
                        jour={date.jour}
                        numero={date.numero}
                        passe={passe}
                        nom={rdv.fournisseurNom}
                        service={
                          passe
                            ? `${rdv.serviceTitre} · ${formatPrixService(rdv)}`
                            : rdv.serviceTitre
                        }
                        horaire={
                          lieu ? `${heureLocale(rdv.debut)} · ${lieu}` : heureLocale(rdv.debut)
                        }
                        badge={<BadgeStatut statut={statut} libelle={textes.statuts[statut]} />}
                        info={infoRendezVous(rdv, d.maintenant)}
                        avis={
                          note === undefined
                            ? null
                            : { libelle: t.votreAvis, note, lecture: textes.commun.surCinq(note) }
                        }
                        actions={actions(rdv, actionsRendezVous(rdv, d.maintenant), d, (href) =>
                          router.push(href),
                        )}
                      />
                    );
                  })}
                </YStack>
              ))
            : null}
          {d && sections.length === 0 ? (
            <YStack flex={1} justifyContent="center" paddingBottom="9">
              {vue === 'aVenir' ? (
                <EtatVide
                  icone="event_upcoming"
                  titre={t.aucunAVenir}
                  texte={t.aucunAVenirTexte}
                  action={{ libelle: t.trouverUnPro, onPress: () => router.push('/') }}
                />
              ) : (
                <EtatVide icone="event_upcoming" titre={t.aucunPasse} texte={t.aucunPasseTexte} />
              )}
            </YStack>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </YStack>
  );
}
