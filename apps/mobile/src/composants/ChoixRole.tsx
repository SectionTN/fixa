import { textes } from '@fixa/core';
import { Bouton, Icone, type NomIcone, Texte } from '@fixa/ui';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import type { TypeCompte } from '../lib/session';
import { BoutonRetour, Ecran } from './Ecran';

const t = textes.auth.role;

type Carte = {
  type: TypeCompte;
  icone: NomIcone;
  fond: string;
  teinte: string;
  titre: string;
  texte: string;
};

const cartes = (): Carte[] => [
  {
    type: 'client',
    icone: 'person_search',
    fond: 'primary-soft',
    teinte: 'primary',
    titre: t.clientTitre,
    texte: t.clientTexte,
  },
  {
    type: 'fournisseur',
    icone: 'handyman',
    fond: 'secondary-soft',
    teinte: 'secondary',
    titre: t.proTitre,
    texte: t.proTexte,
  },
];

// The role choice, before sign-up when signed out, or for a signed-in account that has no role yet.
export function ChoixRole({
  onContinuer,
  onRetour,
  enCours = false,
  erreur,
}: {
  onContinuer: (type: TypeCompte) => void;
  onRetour?: () => void;
  enCours?: boolean;
  erreur?: string | null;
}) {
  const [choix, setChoix] = useState<TypeCompte | null>(null);
  return (
    <Ecran paddingTop="2" paddingHorizontal="6" paddingBottom="9" gap="6">
      {onRetour ? <BoutonRetour onPress={onRetour} /> : null}
      <YStack gap={10}>
        <Texte fontSize="9" fontWeight="600">
          {t.titre}
        </Texte>
        <Texte fontSize="5" lineHeight="24px" color="color-muted">
          {t.sousTitre}
        </Texte>
      </YStack>
      <YStack gap={14}>
        {cartes().map((c) => {
          const actif = choix === c.type;
          return (
            <YStack
              key={c.type}
              position="relative"
              role="radio"
              aria-checked={actif}
              aria-label={c.titre}
              padding="5"
              borderRadius={28}
              backgroundColor="surface press:background-soft"
              borderWidth={2}
              borderColor={actif ? 'primary' : 'border-color'}
              gap={14}
              onPress={() => setChoix(c.type)}
            >
              <XStack
                position="absolute"
                top={18}
                insetInlineEnd={18}
                width={26}
                height={26}
                borderRadius="round"
                alignItems="center"
                justifyContent="center"
                backgroundColor={actif ? 'primary' : 'transparent'}
                borderWidth={actif ? 0 : 2}
                borderColor="border-strong"
              >
                {actif ? <Icone nom="check" taille={18} couleur="on-primary" /> : null}
              </XStack>
              <XStack
                width={56}
                height={56}
                borderRadius={20}
                backgroundColor={c.fond}
                alignItems="center"
                justifyContent="center"
              >
                <Icone nom={c.icone} taille={30} couleur={c.teinte} />
              </XStack>
              <YStack gap={6}>
                <Texte fontSize={19} fontWeight="600">
                  {c.titre}
                </Texte>
                <Texte fontSize={15} lineHeight="22px" color="color-muted">
                  {c.texte}
                </Texte>
              </YStack>
            </YStack>
          );
        })}
      </YStack>
      <YStack marginTop="auto" gap="3">
        {erreur ? (
          <Texte fontSize="3" color="cancelled" textAlign="center">
            {erreur}
          </Texte>
        ) : null}
        <Bouton
          taille="lg"
          desactive={!choix || enCours}
          onPress={() => choix && onContinuer(choix)}
        >
          {t.continuer}
        </Bouton>
      </YStack>
    </Ecran>
  );
}
