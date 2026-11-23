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
  /** Shown instead of the rating while nbAvis is 0. */
  nouveau?: string;
  /** Shown after the review count on the vertical card. */
  distance?: string | null;
  prix: string | null;
  dispo: string | null;
  initiales: string;
  /** Category theme key such as 'cat1'. */
  couleur: string;
  onPress: () => void;
  /** Shows a heart when set: filled when true. */
  favori?: boolean;
  onFavori?: () => void;
  favoriLibelle?: string;
  /** A short action at the end of a row card, such as Réserver. */
  action?: { libelle: string; onPress: () => void };
};

function Coeur({
  favori,
  onPress,
  libelle,
  surPhoto,
}: {
  favori: boolean;
  onPress: () => void;
  libelle: string;
  surPhoto?: boolean;
}) {
  return (
    <XStack
      role="button"
      aria-label={libelle}
      width={36}
      height={36}
      borderRadius="round"
      backgroundColor={surPhoto ? 'surface' : 'transparent'}
      alignItems="center"
      justifyContent="center"
      hitSlop={6}
      onPress={onPress}
    >
      <Icone nom={favori ? 'favorite_fill' : 'favorite'} taille={22} couleur="primary" />
    </XStack>
  );
}

const OMBRE = {
  shadowColor: 'shadow-color',
  shadowOffset: { width: 0, height: 1 },
  shadowRadius: 3,
} as const;

// The rating, or a "new" pill while a pro has no review yet, since 0,0 (0) reads as a bad score.
function Note({
  note,
  nbAvis,
  nouveau,
  suite,
}: {
  note: string;
  nbAvis: number;
  nouveau?: string;
  suite?: string;
}) {
  if (nbAvis === 0 && nouveau) {
    return (
      <XStack gap={5} alignItems="center" flexShrink={1}>
        <XStack
          backgroundColor="primary-soft"
          borderRadius="round"
          paddingHorizontal={8}
          paddingVertical={2}
        >
          <Texte fontSize="2" fontWeight="600" color="on-primary-soft">
            {nouveau}
          </Texte>
        </XStack>
        {suite ? (
          <Texte fontSize="3" color="color-muted" numberOfLines={1} flexShrink={1}>
            {suite}
          </Texte>
        ) : null}
      </XStack>
    );
  }
  return (
    <XStack gap={5} alignItems="center" flexShrink={1}>
      <Icone nom="star_fill" taille={16} couleur="star" />
      <Texte fontSize="3" fontWeight="600">
        {note}
      </Texte>
      <Texte fontSize="3" color="color-muted" numberOfLines={1} flexShrink={1}>
        ({nbAvis}){suite ? ` · ${suite}` : ''}
      </Texte>
    </XStack>
  );
}

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
        <XStack alignItems="center" gap="2">
          <YStack flex={1} minWidth={0}>
            <Nom nom={p.nom} verifie={p.verifie} />
          </YStack>
          {p.onFavori ? (
            // The heart keeps its 36 pt target without making the name row taller.
            <YStack marginVertical={-8} marginEnd={-6}>
              <Coeur
                favori={p.favori ?? false}
                onPress={p.onFavori}
                libelle={p.favoriLibelle ?? p.nom}
              />
            </YStack>
          ) : null}
        </XStack>
        <Texte fontSize="3" color="color-muted" numberOfLines={1}>
          {p.sousTitre}
        </Texte>
        <XStack gap={5} alignItems="center" marginTop={2}>
          <Note note={p.note} nbAvis={p.nbAvis} nouveau={p.nouveau} />
          <XStack flex={1} />
          {p.prix ? (
            <Texte fontSize="4" fontWeight="600">
              {p.prix}
            </Texte>
          ) : null}
        </XStack>
        {p.dispo || p.action ? (
          <XStack alignItems="center" gap="2" marginTop="1">
            {p.dispo ? (
              <XStack
                height={26}
                paddingStart={6}
                paddingEnd={10}
                gap="1"
                borderRadius="round"
                backgroundColor="completed-soft"
                alignItems="center"
                flexShrink={1}
              >
                <Icone nom="bolt" taille={15} couleur="completed" />
                <Texte fontSize="2" fontWeight="500" color="completed" numberOfLines={1}>
                  {p.dispo}
                </Texte>
              </XStack>
            ) : null}
            <XStack flex={1} />
            {p.action ? (
              <XStack
                role="button"
                aria-label={p.action.libelle}
                height={34}
                paddingHorizontal="4"
                borderRadius="round"
                backgroundColor="primary-soft press:background-press"
                alignItems="center"
                hitSlop={{ top: 5, bottom: 5 }}
                onPress={p.action.onPress}
              >
                <Texte fontSize="3" fontWeight="600" color="on-primary-soft">
                  {p.action.libelle}
                </Texte>
              </XStack>
            ) : null}
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
        {p.onFavori ? (
          <YStack position="absolute" top={8} insetInlineEnd={8}>
            <Coeur
              favori={p.favori ?? false}
              onPress={p.onFavori}
              libelle={p.favoriLibelle ?? p.nom}
              surPhoto
            />
          </YStack>
        ) : null}
      </XStack>
      <YStack padding={14} gap={5}>
        <Nom nom={p.nom} verifie={p.verifie} />
        <Texte fontSize="3" color="color-muted" numberOfLines={1}>
          {p.sousTitre}
        </Texte>
        <XStack gap={5} alignItems="center" marginTop={2}>
          <Note
            note={p.note}
            nbAvis={p.nbAvis}
            nouveau={p.nouveau}
            suite={p.distance ?? undefined}
          />
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
