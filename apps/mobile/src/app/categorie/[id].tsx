import {
  correspondRecherche,
  FILTRES_VIDES,
  filtrerFournisseurs,
  interpreterRecherche,
  nbFiltresActifs,
  textes,
  trierFournisseurs,
} from '@fixa/core';
import { ChampRecherche, EtatVide, Puce, Texte } from '@fixa/ui';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { CartePro } from '../../composants/CartePro';
import { BoutonRetour, Ecran } from '../../composants/Ecran';
import { FeuilleFiltres } from '../../composants/FeuilleFiltres';
import { ErreurChargement } from '../../composants/Section';
import {
  chargerFournisseurs,
  couleurDe,
  lireCategories,
  lireProfil,
  positionDe,
  useLecture,
} from '../../lib/donnees';
import { useSession } from '../../lib/session';

const t = textes.recherche;
const TOUT = 'tout';

// Results for a category, or for a typed search when the id is "tout".
export default function Resultats() {
  const { id, q } = useLocalSearchParams<{ id: string; q?: string }>();
  const router = useRouter();
  const { utilisateur } = useSession();
  const uid = utilisateur?.id ?? null;
  const [recherche, setRecherche] = useState(q ?? '');
  const [texte, setTexte] = useState(q ?? '');
  const [filtres, setFiltres] = useState(FILTRES_VIDES);
  const [feuille, setFeuille] = useState(false);

  const lecture = useLecture(`resultats:${id}:${recherche}:${uid}`, async () => {
    const maintenant = new Date();
    const [categories, profil] = await Promise.all([
      lireCategories(),
      uid ? lireProfil(uid) : null,
    ]);
    const requete =
      id === TOUT ? (interpreterRecherche(recherche, categories) ?? {}) : { categorieIds: [id] };
    const pros = await chargerFournisseurs(requete, positionDe(profil), maintenant);
    return { categories, pros, maintenant };
  });
  const d = lecture.donnees;

  const categorie = d?.categories.find((c) => c.$id === id);
  const titre = categorie?.nom ?? (recherche ? t.resultatsPour(recherche) : t.tousLesPros);
  const affines = d ? d.pros.filter((p) => correspondRecherche(p, texte, d.categories)) : [];
  const resultats = d ? trierFournisseurs(filtrerFournisseurs(affines, filtres, d.maintenant)) : [];
  const villes = [...new Set(d?.pros.map((p) => p.ville) ?? [])].sort((a, b) => a.localeCompare(b));
  const note = t.filtres.notes.find((n) => n.valeur === filtres.noteMin && n.valeur > 0);
  const prixActif = filtres.prixPlancher > 0 || filtres.prixPlafond !== null;
  const ouvrir = () => setFeuille(true);

  return (
    <YStack flex={1}>
      {/* iOS 26 swipes back from anywhere, which takes the slider's horizontal drag in the sheet. */}
      <Stack.Screen options={{ gestureEnabled: !feuille }} />
      {/* While the sheet is open, screen readers stay on it instead of the list under the overlay. */}
      <YStack flex={1} aria-hidden={feuille}>
        <Ecran paddingTop="1" paddingHorizontal="5" paddingBottom="6" gap={14}>
          <XStack gap="3" alignItems="center">
            <BoutonRetour onPress={() => router.back()} />
            <YStack flex={1} gap={2}>
              <Texte fontSize="6" fontWeight="600" numberOfLines={1}>
                {titre}
              </Texte>
              {d ? (
                <Texte fontSize="3" color="color-muted">
                  {[t.nbPros(d.pros.length), filtres.ville].filter(Boolean).join(' · ')}
                </Texte>
              ) : null}
            </YStack>
          </XStack>

          <ChampRecherche
            variante="bordure"
            valeur={texte}
            onChange={setTexte}
            onValider={(saisie) => {
              setTexte(saisie);
              if (id === TOUT) setRecherche(saisie.trim());
            }}
            indice={t.rechercher(t.metiers[id])}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginEnd: -20 }}
            contentContainerStyle={{ gap: 8, paddingEnd: 20, paddingVertical: 4 }}
          >
            <Puce
              etat="primaire"
              icone="tune"
              libelle={t.filtres.actifs(nbFiltresActifs(filtres))}
              onPress={ouvrir}
            />
            <Puce
              etat={filtres.ville ? 'choisi' : 'repos'}
              libelle={filtres.ville ?? t.filtres.ville}
              deroulant
              onPress={ouvrir}
            />
            <Puce
              etat={note ? 'choisi' : 'repos'}
              icone={note ? 'star_fill' : undefined}
              libelle={note?.libelle ?? t.filtres.note}
              deroulant
              onPress={ouvrir}
            />
            <Puce
              etat={prixActif ? 'choisi' : 'repos'}
              libelle={
                prixActif
                  ? t.filtres.prixPlage(filtres.prixPlancher, filtres.prixPlafond)
                  : t.filtres.prix
              }
              deroulant
              onPress={ouvrir}
            />
            <Puce
              etat={filtres.dispo ? 'choisi' : 'repos'}
              libelle={filtres.dispo ? t.filtres.dispo[filtres.dispo] : t.filtres.disponibilite}
              deroulant
              onPress={ouvrir}
            />
          </ScrollView>

          {lecture.erreur && !d ? <ErreurChargement onReessayer={lecture.recharger} /> : null}

          {d && !lecture.chargement && resultats.length > 0 ? (
            <>
              <XStack justifyContent="space-between" alignItems="center">
                <Texte fontSize="3" color="color-muted">
                  {t.nbResultats(resultats.length)}
                </Texte>
                <Texte fontSize="3" fontWeight="500">
                  {t.trier}
                </Texte>
              </XStack>
              {resultats.map((pro) => (
                <CartePro
                  key={pro.$id}
                  pro={pro}
                  variante="ligne"
                  couleur={couleurDe(d.categories, pro.categorieId)}
                  maintenant={d.maintenant}
                />
              ))}
            </>
          ) : null}

          {d && !lecture.chargement && resultats.length === 0 ? (
            <EtatVide
              icone="search_off"
              titre={t.vide.titre}
              texte={t.vide.texte}
              action={{
                libelle: t.vide.action,
                onPress: () => {
                  setFiltres(FILTRES_VIDES);
                  setTexte('');
                  setRecherche('');
                },
              }}
            />
          ) : null}
        </Ecran>
      </YStack>

      {d ? (
        <FeuilleFiltres
          ouverte={feuille}
          onFermer={() => setFeuille(false)}
          filtres={filtres}
          onAppliquer={(f) => {
            setFiltres(f);
            setFeuille(false);
          }}
          liste={affines}
          villes={villes}
          maintenant={d.maintenant}
        />
      ) : null}
    </YStack>
  );
}
