import { type Categorie, mieuxNotes, textes } from '@fixa/core';
import { ChampRecherche, Icone, Texte, TuileCategorie } from '@fixa/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { BoutonYosr } from '../../composants/BoutonYosr';
import { CartePro } from '../../composants/CartePro';
import { Cloche } from '../../composants/Cloche';
import { Ecran } from '../../composants/Ecran';
import { ErreurChargement, Section } from '../../composants/Section';
import { SqueletteAccueil } from '../../composants/Squelette';
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
const COLONNES = 4;
const NB_MIEUX_NOTES = 5;

function enLignes<T>(liste: T[], taille: number): T[][] {
  return Array.from({ length: Math.ceil(liste.length / taille) }, (_, i) =>
    liste.slice(i * taille, (i + 1) * taille),
  );
}

export default function Accueil() {
  const { utilisateur } = useSession();
  const router = useRouter();
  const [texte, setTexte] = useState('');
  const id = utilisateur?.id ?? null;
  const lecture = useLecture(`accueil:${id}`, async () => {
    const maintenant = new Date();
    const profil = id ? await lireProfil(id) : null;
    const [categories, pros] = await Promise.all([
      lireCategories(),
      chargerFournisseurs({}, positionDe(profil), maintenant),
    ]);
    return { profil, categories, top: mieuxNotes(pros, NB_MIEUX_NOTES), maintenant };
  });
  const d = lecture.donnees;
  const prenom = d?.profil?.prenom || utilisateur?.nom.split(' ')[0];
  const ouvrir = (categorieId: string, q?: string) =>
    router.push({
      pathname: '/categorie/[id]',
      params: q ? { id: categorieId, q } : { id: categorieId },
    });
  const chercher = (saisie: string) => {
    if (saisie.trim().length >= 3) ouvrir('tout', saisie.trim());
  };
  const tuiles: (Categorie | null)[] = [...(d?.categories ?? []), null];

  return (
    <YStack flex={1}>
      <Ecran paddingTop="1" paddingHorizontal="5" paddingBottom="6" gap="5">
        <XStack gap="3" alignItems="flex-start">
          <YStack flex={1} gap={6}>
            {d?.profil?.ville ? (
              <XStack gap="1" alignItems="center">
                <Icone nom="location_on_fill" taille={17} couleur="primary" />
                <Texte fontSize="3" fontWeight="500" color="color-muted">
                  {d.profil.ville}
                </Texte>
              </XStack>
            ) : null}
            <Texte fontSize={26} lineHeight="32px" fontWeight="600" letterSpacing={-0.52}>
              {t.bonjour(prenom)}
            </Texte>
            <Texte fontSize={15} color="color-muted">
              {t.question}
            </Texte>
          </YStack>
          {id ? <Cloche uid={id} /> : null}
        </XStack>

        <ChampRecherche
          variante="flottant"
          valeur={texte}
          onChange={setTexte}
          onValider={chercher}
          indice={t.indice}
          fin={
            <XStack
              role="button"
              aria-label={t.filtres.titre}
              width={40}
              height={40}
              borderRadius="round"
              backgroundColor="primary press:primary"
              alignItems="center"
              justifyContent="center"
              onPress={() => ouvrir('tout')}
            >
              <Icone nom="tune" taille={20} couleur="on-primary" />
            </XStack>
          }
        />

        {lecture.erreur && !d ? <ErreurChargement onReessayer={lecture.recharger} /> : null}
        {!d && !lecture.erreur ? <SqueletteAccueil /> : null}

        {d ? (
          <>
            <Section
              titre={t.categories}
              lien={{ libelle: t.toutVoir, onPress: () => ouvrir('tout') }}
            >
              <YStack gap={14}>
                {enLignes(tuiles, COLONNES).map((ligne) => (
                  <XStack key={ligne.map((c) => c?.$id ?? 'tout').join()} gap="2">
                    {ligne.map((c) =>
                      c ? (
                        <TuileCategorie
                          key={c.$id}
                          nom={c.nom}
                          icone={c.icone}
                          couleur={c.couleur}
                          onPress={() => ouvrir(c.$id)}
                        />
                      ) : (
                        <TuileCategorie
                          key="tout"
                          nom={t.toutVoir}
                          icone="grid_view"
                          couleur="color-muted"
                          toutVoir
                          onPress={() => ouvrir('tout')}
                        />
                      ),
                    )}
                  </XStack>
                ))}
              </YStack>
            </Section>

            <Section
              titre={t.mieuxNotes}
              lien={{ libelle: t.voirTout, onPress: () => ouvrir('tout') }}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0, marginHorizontal: -20 }}
                contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 4, gap: 12 }}
              >
                {d.top.map((pro) => (
                  <CartePro
                    key={pro.$id}
                    pro={pro}
                    variante="verticale"
                    couleur={couleurDe(d.categories, pro.categorieId)}
                    maintenant={d.maintenant}
                  />
                ))}
              </ScrollView>
            </Section>
          </>
        ) : null}
      </Ecran>
      <BoutonYosr />
    </YStack>
  );
}
