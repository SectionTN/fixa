import { XStack, YStack } from 'tamagui';
import { Icone } from './Icone';
import { Texte } from './Texte';

export type CarteFournisseurProps = {
  variante: 'ligne' | 'verticale';
  nom: string;
  verifie: boolean;
  /** Speciality, city and, on a row, the distance, already joined. */
  sousTitre: string;
  note: string;
  nbAvis: number;
  /** Shown after the review count on the vertical card. */
  distance?: string | null;
  prix: string | null;
  dispo: string | null;
  initiales: string;
  /** Category theme key such as 'cat1'. */
  couleur: string;
  onPress: () => void;
};

const OMBRE = {
  shadowColor: 'shadow-color',
  shadowOffset: { width: 0, height: 1 },
  shadowRadius: 3,
} as const;

function Nom({ nom, verifie }: { nom: string; verifie: boolean }) {
  return (
    <XStack gap={5} alignItems="center">
      <Texte fontSize="5" fontWeight="600" numberOfLines={1} flexShrink={1}>
        {nom}
      </Texte>
      {verifie ? <Icone nom="verified_fill" taille={17} couleur="secondary" /> : null}
    </XStack>
  );
}

function Ligne(p: CarteFournisseurProps) {
  return (
    <XStack
      role="button"
      aria-label={p.nom}
      gap={14}
      padding={14}
      borderRadius="5"
      backgroundColor="surface press:background-press"
      alignItems="flex-start"
      {...OMBRE}
      onPress={p.onPress}
    >
      <XStack
        width={64}
        height={64}
        borderRadius={20}
        backgroundColor={`${p.couleur}-soft`}
        alignItems="center"
        justifyContent="center"
      >
        <Texte fontSize="7" fontWeight="600" color={p.couleur}>
          {p.initiales}
        </Texte>
      </XStack>
      <YStack flex={1} gap="1" minWidth={0}>
        <Nom nom={p.nom} verifie={p.verifie} />
        <Texte fontSize="3" color="color-muted" numberOfLines={1}>
          {p.sousTitre}
        </Texte>
        <XStack gap={5} alignItems="center" marginTop={2}>
          <Icone nom="star_fill" taille={16} couleur="star" />
          <Texte fontSize="3" fontWeight="600">
            {p.note}
          </Texte>
          <Texte fontSize="3" color="color-muted">
            ({p.nbAvis})
          </Texte>
          <XStack flex={1} />
          {p.prix ? (
            <Texte fontSize="4" fontWeight="600">
              {p.prix}
            </Texte>
          ) : null}
        </XStack>
        {p.dispo ? (
          <XStack
            alignSelf="flex-start"
            height={26}
            paddingStart={6}
            paddingEnd={10}
            gap="1"
            marginTop="1"
            borderRadius="round"
            backgroundColor="completed-soft"
            alignItems="center"
          >
            <Icone nom="bolt" taille={15} couleur="completed" />
            <Texte fontSize="2" fontWeight="500" color="completed">
              {p.dispo}
            </Texte>
          </XStack>
        ) : null}
      </YStack>
    </XStack>
  );
}

function Verticale(p: CarteFournisseurProps) {
  return (
    <YStack
      role="button"
      aria-label={p.nom}
      width={236}
      borderRadius="5"
      backgroundColor="surface press:background-press"
      overflow="hidden"
      {...OMBRE}
      onPress={p.onPress}
    >
      <XStack
        height={124}
        backgroundColor={`${p.couleur}-soft`}
        alignItems="center"
        justifyContent="center"
      >
        <Texte fontSize="9" fontWeight="600" color={p.couleur}>
          {p.initiales}
        </Texte>
        {p.dispo ? (
          <XStack
            position="absolute"
            top={12}
            insetInlineStart={10}
            height={24}
            paddingHorizontal={10}
            borderRadius="round"
            backgroundColor="completed-soft"
            alignItems="center"
          >
            <Texte fontSize="2" fontWeight="500" color="completed">
              {p.dispo}
            </Texte>
          </XStack>
        ) : null}
      </XStack>
      <YStack padding={14} gap={5}>
        <Nom nom={p.nom} verifie={p.verifie} />
        <Texte fontSize="3" color="color-muted" numberOfLines={1}>
          {p.sousTitre}
        </Texte>
        <XStack gap={5} alignItems="center" marginTop={2}>
          <Icone nom="star_fill" taille={16} couleur="star" />
          <Texte fontSize="3" fontWeight="600">
            {p.note}
          </Texte>
          <Texte fontSize="3" color="color-muted" numberOfLines={1} flexShrink={1}>
            ({p.nbAvis}){p.distance ? ` · ${p.distance}` : ''}
          </Texte>
          <XStack flex={1} />
          {p.prix ? (
            <Texte fontSize="3" fontWeight="600">
              {p.prix}
            </Texte>
          ) : null}
        </XStack>
      </YStack>
    </YStack>
  );
}

export function CarteFournisseur(p: CarteFournisseurProps) {
  return p.variante === 'ligne' ? <Ligne {...p} /> : <Verticale {...p} />;
}
