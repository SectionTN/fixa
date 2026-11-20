import type { ReactNode } from 'react';
import { isWeb, XStack, YStack } from 'tamagui';
import { Bouton } from './Bouton';
import { Icone } from './Icone';
import type { NomIcone } from './icones.generated';
import { Texte } from './Texte';

export type CarteDemandeProps = {
  nom: string;
  initiales: string;
  /** Such as "Il y a 2 min · via Yosr". */
  sousTitre: string;
  /** The urgent flag label, shown when the request is urgent. */
  urgent?: string;
  lignes: { icone: NomIcone; texte: string }[];
  /** The client's description, shown quoted. */
  citation?: string;
  /** The response deadline of a pending request, such as "Avant 11:15". */
  delai?: string;
  /** The status badge of an answered request, in place of the deadline. */
  badge?: ReactNode;
  refuser?: { libelle: string; onPress: () => void };
  accepter?: { libelle: string; onPress: () => void; desactive?: boolean };
  onPress: () => void;
};

// A booking request as the provider sees it in the list, with its answer buttons while pending.
export function CarteDemande(p: CarteDemandeProps) {
  return (
    <YStack padding="4" gap="3" borderRadius="6" backgroundColor="surface">
      <YStack role="button" accessible={isWeb ? undefined : true} gap="3" onPress={p.onPress}>
        <XStack gap="3" alignItems="center">
          <XStack
            width={44}
            height={44}
            borderRadius="round"
            backgroundColor="accent-soft"
            alignItems="center"
            justifyContent="center"
          >
            <Texte fontSize="5" fontWeight="600" color="on-primary-soft">
              {p.initiales}
            </Texte>
          </XStack>
          <YStack flex={1} minWidth={0} gap={2}>
            <Texte fontSize={15} fontWeight="600" numberOfLines={1}>
              {p.nom}
            </Texte>
            <Texte fontSize="3" color="color-muted" numberOfLines={1}>
              {p.sousTitre}
            </Texte>
          </YStack>
          {p.urgent ? (
            <XStack
              height={28}
              paddingHorizontal={10}
              gap={4}
              borderRadius="round"
              backgroundColor="primary-soft"
              alignItems="center"
            >
              <Icone nom="bolt" taille={16} couleur="on-primary-soft" />
              <Texte fontSize="2" fontWeight="600" color="on-primary-soft">
                {p.urgent}
              </Texte>
            </XStack>
          ) : null}
        </XStack>
        <YStack gap="2">
          {p.lignes.map((l) => (
            <XStack key={l.texte} gap="3" alignItems="center">
              <Icone nom={l.icone} taille={18} couleur="color-muted" />
              <Texte flex={1} fontSize="4" numberOfLines={1}>
                {l.texte}
              </Texte>
            </XStack>
          ))}
        </YStack>
        {p.citation ? (
          <YStack padding="3" borderRadius="4" backgroundColor="background-soft">
            <Texte fontSize="4" color="color-muted" numberOfLines={2}>
              {`« ${p.citation} »`}
            </Texte>
          </YStack>
        ) : null}
      </YStack>
      <XStack gap="3" alignItems="center">
        <XStack flex={1} minWidth={0} gap="2" alignItems="center">
          {p.delai ? (
            <>
              <Icone nom="timer" taille={18} couleur="pending" />
              <Texte flexShrink={1} fontSize="3" fontWeight="600" color="pending" numberOfLines={2}>
                {p.delai}
              </Texte>
            </>
          ) : (
            p.badge
          )}
        </XStack>
        {p.refuser ? (
          <Bouton variante="outline" taille="sm" onPress={p.refuser.onPress}>
            {p.refuser.libelle}
          </Bouton>
        ) : null}
        {p.accepter ? (
          <Bouton taille="sm" desactive={p.accepter.desactive} onPress={p.accepter.onPress}>
            {p.accepter.libelle}
          </Bouton>
        ) : null}
      </XStack>
    </YStack>
  );
}
