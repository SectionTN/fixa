import { fr } from '@fixa/core';
import { Bouton, Texte } from '@fixa/ui';
import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';

// A titled block with an optional link at the end of its header row.
export function Section({
  titre,
  lien,
  children,
}: {
  titre: string;
  lien?: { libelle: string; onPress: () => void };
  children: ReactNode;
}) {
  return (
    <YStack gap={14} marginTop="1">
      <XStack alignItems="center" justifyContent="space-between" gap="3">
        <Texte fontSize="6" fontWeight="600" flexShrink={1}>
          {titre}
        </Texte>
        {lien ? (
          <Texte
            role="link"
            fontSize="4"
            fontWeight="500"
            color="primary"
            hitSlop={12}
            onPress={lien.onPress}
          >
            {lien.libelle}
          </Texte>
        ) : null}
      </XStack>
      {children}
    </YStack>
  );
}

export function ErreurChargement({ onReessayer }: { onReessayer: () => void }) {
  return (
    <YStack gap="3" alignItems="flex-start">
      <Texte fontSize="4" color="color-muted">
        {fr.recherche.erreur}
      </Texte>
      <Bouton variante="outline" taille="sm" onPress={onReessayer}>
        {fr.recherche.reessayer}
      </Bouton>
    </YStack>
  );
}
