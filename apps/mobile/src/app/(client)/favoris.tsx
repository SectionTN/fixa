import { textes } from '@fixa/core';
import { EtatVide, Puce, Texte } from '@fixa/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { BoutonYosr } from '../../composants/BoutonYosr';
import { CartePro } from '../../composants/CartePro';
import { BORDS_ECRAN, Ecran, MARGE_HAUT_MIN } from '../../composants/Ecran';
import { useBasOnglets } from '../../composants/Onglet';
import { ErreurChargement } from '../../composants/Section';
import { SqueletteResultats } from '../../composants/Squelette';
import {
  chargerFournisseurs,
  couleurDe,
  lireCategories,
  lireProfil,
  positionDe,
  useLecture,
} from '../../lib/donnees';
import { useFavoris } from '../../lib/favoris';
import { useSession } from '../../lib/session';

const t = textes.favoris;
// Room under the last card for the Yosr button, which floats 16 pt above the tab bar.
const ESPACE_YOSR = 96;

export default function Favoris() {
  const { utilisateur } = useSession();
  const router = useRouter();
  if (utilisateur) return <Liste uid={utilisateur.id} />;
  return (
    <YStack flex={1}>
      <Ecran paddingTop="2" paddingHorizontal="5" gap="5">
        <Texte fontSize="9" fontWeight="600">
          {t.titre}
        </Texte>
        <YStack flex={1} justifyContent="center" paddingBottom="9">
          <EtatVide
            icone="favorite"
            titre={t.visiteurTitre}
            texte={t.visiteurTexte}
            action={{
              libelle: textes.auth.visiteur.seConnecter,
              onPress: () => router.push('/connexion'),
            }}
          />
        </YStack>
      </Ecran>
      <BoutonYosr />
    </YStack>
  );
}

// The saved pros, newest first, with a chip for each of their categories.
function Liste({ uid }: { uid: string }) {
  const router = useRouter();
  const bas = useBasOnglets();
  const ids = useFavoris(uid);
  const [categorie, setCategorie] = useState<string | null>(null);

  const lecture = useLecture(`favoris:${uid}:${[...ids].sort().join(',')}`, async () => {
    const maintenant = new Date();
    const [categories, profil] = await Promise.all([lireCategories(), lireProfil(uid)]);
    const pros =
      ids.length > 0
        ? await chargerFournisseurs({ ids: [...ids] }, positionDe(profil), maintenant)
        : [];
    return { categories, pros, maintenant };
  });
  const d = lecture.donnees;

  // A heart removed here drops the card at once, before the new read comes back.
  const parId = new Map(d?.pros.map((p) => [p.$id, p]));
  const liste = ids.flatMap((id) => parId.get(id) ?? []);
  const presentes = d?.categories.filter((c) => liste.some((p) => p.categorieId === c.$id)) ?? [];
  const choisie = presentes.some((c) => c.$id === categorie) ? categorie : null;
  // A chip whose last pro was removed is let go, so it does not come back on its own later.
  if (d && choisie !== categorie) setCategorie(null);
  const affiches = choisie ? liste.filter((p) => p.categorieId === choisie) : liste;
  const vide = ids.length === 0 || (d !== null && !lecture.chargement && liste.length === 0);

  return (
    <YStack flex={1} backgroundColor="background">
      <SafeAreaView edges={BORDS_ECRAN} style={{ flex: 1, paddingTop: MARGE_HAUT_MIN }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: bas + ESPACE_YOSR,
            gap: 14,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={lecture.recharger} />}
        >
          <XStack justifyContent="space-between" alignItems="baseline" gap="3">
            <Texte fontSize="9" fontWeight="600">
              {t.titre}
            </Texte>
            {d && liste.length > 0 ? (
              <Texte fontSize="4" color="color-muted">
                {t.nbPros(liste.length)}
              </Texte>
            ) : null}
          </XStack>

          {d && liste.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, marginHorizontal: -20 }}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 4 }}
            >
              <Puce
                etat={choisie === null ? 'primaire' : 'repos'}
                libelle={t.tous(liste.length)}
                onPress={() => setCategorie(null)}
              />
              {presentes.map((c) => (
                <Puce
                  key={c.$id}
                  etat={choisie === c.$id ? 'primaire' : 'repos'}
                  libelle={c.nom}
                  onPress={() => setCategorie(c.$id)}
                />
              ))}
            </ScrollView>
          ) : null}

          {lecture.erreur && !d && !vide ? (
            <ErreurChargement onReessayer={lecture.recharger} />
          ) : null}
          {!vide && liste.length === 0 && !lecture.erreur ? <SqueletteResultats /> : null}

          {d
            ? affiches.map((pro) => (
                <CartePro
                  key={pro.$id}
                  pro={pro}
                  variante="ligne"
                  couleur={couleurDe(d.categories, pro.categorieId)}
                  maintenant={d.maintenant}
                  action={{
                    libelle: t.reserver,
                    onPress: () =>
                      router.push({
                        pathname: '/reserver/[fournisseurId]',
                        params: { fournisseurId: pro.$id },
                      }),
                  }}
                />
              ))
            : null}

          {vide ? (
            <YStack flex={1} justifyContent="center" paddingBottom="9">
              <EtatVide
                icone="favorite"
                titre={t.vide}
                texte={t.videTexte}
                action={{ libelle: t.trouver, onPress: () => router.navigate('/') }}
              />
            </YStack>
          ) : null}
        </ScrollView>
      </SafeAreaView>
      <BoutonYosr />
    </YStack>
  );
}
