import {
  FILTRES_VIDES,
  type FiltreDispo,
  type Filtres,
  type FournisseurAffiche,
  filtrerFournisseurs,
  fr,
} from '@fixa/core';
import { Bouton, CurseurPlage, Feuille, Icone, Puce, Texte } from '@fixa/ui';
import { type ReactNode, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';

const t = fr.recherche.filtres;
export const PRIX_MAX = 150;
const PAS_PRIX = 5;
const DISPOS: FiltreDispo[] = ['aujourdhui', 'demain', 'semaine'];

function Bloc({ titre, fin, children }: { titre: string; fin?: ReactNode; children: ReactNode }) {
  return (
    <YStack gap="3">
      <XStack justifyContent="space-between" alignItems="center">
        <Texte fontSize={15} fontWeight="600">
          {titre}
        </Texte>
        {fin}
      </XStack>
      {children}
    </YStack>
  );
}

function NoteMinimale({ valeur, onChange }: { valeur: number; onChange: (v: number) => void }) {
  return (
    <XStack padding="1" gap="1" borderRadius="round" backgroundColor="background-soft">
      {t.notes.map((n) => {
        const choisie = n.valeur === valeur;
        return (
          <XStack
            key={n.valeur}
            role="radio"
            aria-checked={choisie}
            aria-label={n.libelle}
            flex={1}
            height={40}
            gap={6}
            borderRadius="round"
            alignItems="center"
            justifyContent="center"
            backgroundColor={choisie ? 'surface' : 'transparent'}
            shadowColor={choisie ? 'shadow-color' : 'transparent'}
            shadowOffset={{ width: 0, height: 1 }}
            shadowRadius={choisie ? 3 : 0}
            onPress={() => onChange(n.valeur)}
          >
            {choisie && n.valeur > 0 ? <Icone nom="star_fill" taille={15} couleur="star" /> : null}
            <Texte
              fontSize="4"
              fontWeight={choisie ? '600' : '500'}
              color={choisie ? 'color' : 'color-muted'}
            >
              {n.libelle}
            </Texte>
          </XStack>
        );
      })}
    </XStack>
  );
}

type FeuilleFiltresProps = {
  ouverte: boolean;
  onFermer: () => void;
  filtres: Filtres;
  onAppliquer: (f: Filtres) => void;
  liste: FournisseurAffiche[];
  villes: string[];
  maintenant: Date;
};

// Edits a draft, so closing the sheet without "Voir" leaves the list as it was.
export function FeuilleFiltres(p: FeuilleFiltresProps) {
  const { bottom, left, right } = useSafeAreaInsets();
  const [brouillon, setBrouillon] = useState(p.filtres);
  const { ouverte, filtres } = p;
  useEffect(() => {
    if (ouverte) setBrouillon(filtres);
  }, [ouverte, filtres]);
  const changer = (champ: Partial<Filtres>) => setBrouillon((b) => ({ ...b, ...champ }));
  const nombre = filtrerFournisseurs(p.liste, brouillon, p.maintenant).length;
  const plafond = brouillon.prixPlafond ?? PRIX_MAX;

  return (
    <Feuille
      ouverte={p.ouverte}
      onFermer={p.onFermer}
      margeBas={bottom}
      margesCotes={{ left, right }}
      pied={
        <YStack flex={1}>
          <Bouton taille="lg" onPress={() => p.onAppliquer(brouillon)}>
            {t.voir(nombre)}
          </Bouton>
        </YStack>
      }
    >
      <YStack gap={18}>
        <XStack justifyContent="space-between" alignItems="center">
          <Texte fontSize="7" fontWeight="600">
            {t.titre}
          </Texte>
          <Texte
            role="button"
            fontSize="4"
            fontWeight="500"
            color="primary"
            hitSlop={12}
            onPress={() => setBrouillon(FILTRES_VIDES)}
          >
            {t.reinitialiser}
          </Texte>
        </XStack>

        {p.villes.length > 1 ? (
          <Bloc titre={t.ville}>
            <XStack flexWrap="wrap" gap="2">
              {p.villes.map((ville) => {
                const choisie = brouillon.ville === ville;
                return (
                  <Puce
                    key={ville}
                    libelle={ville}
                    etat={choisie ? 'choisi' : 'repos'}
                    icone={choisie ? 'check' : undefined}
                    onPress={() => changer({ ville: choisie ? null : ville })}
                  />
                );
              })}
            </XStack>
          </Bloc>
        ) : null}

        <Bloc titre={t.noteMinimale}>
          <NoteMinimale valeur={brouillon.noteMin} onChange={(noteMin) => changer({ noteMin })} />
        </Bloc>

        <Bloc
          titre={t.prixDeDepart}
          fin={
            <Texte fontSize="4" fontWeight="500">
              {t.prixPlage(brouillon.prixPlancher, brouillon.prixPlafond)}
            </Texte>
          }
        >
          <CurseurPlage
            min={0}
            max={PRIX_MAX}
            pas={PAS_PRIX}
            valeur={[brouillon.prixPlancher, plafond]}
            onChange={([de, a]) =>
              changer({ prixPlancher: de, prixPlafond: a >= PRIX_MAX ? null : a })
            }
            libelles={[t.prixMin, t.prixMax]}
          />
          <XStack justifyContent="space-between">
            <Texte fontSize="2" color="color-subtle">
              {t.prixBorneBasse}
            </Texte>
            <Texte fontSize="2" color="color-subtle">
              {t.prixBorneHaute}
            </Texte>
          </XStack>
        </Bloc>

        <Bloc titre={t.disponibilite}>
          <XStack flexWrap="wrap" gap="2">
            {DISPOS.map((d) => {
              const choisie = brouillon.dispo === d;
              return (
                <Puce
                  key={d}
                  libelle={t.dispo[d]}
                  etat={choisie ? 'choisi' : 'repos'}
                  icone={choisie ? 'check' : undefined}
                  onPress={() => changer({ dispo: choisie ? null : d })}
                />
              );
            })}
          </XStack>
        </Bloc>
      </YStack>
    </Feuille>
  );
}
