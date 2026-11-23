import { YStack } from 'tamagui';

// The design's 60 pt face: oval eyes 21 pt from the top and 19 pt from each side, a smile below.
const BASE = 60;
const OEIL = { haut: 21, cote: 19, largeur: 6, hauteur: 8 };
const SOURIRE = { haut: 33, gauche: 22, largeur: 16, hauteur: 8, trait: 2.5 };

type Props = {
  taille: number;
  fond: 'primary' | 'yosr-face';
  encre: 'on-primary' | 'yosr-ink';
};

// Yosr's face as the design draws it, two eyes and a smile on a round fill, at any size.
export function VisageYosr({ taille, fond, encre }: Props) {
  const k = taille / BASE;
  // Below the button size the features stay a little larger, as the design's 28 and 36 pt avatars do.
  const f = taille < BASE ? k * 1.12 : k;
  const oeil = {
    position: 'absolute' as const,
    top: OEIL.haut * k,
    width: OEIL.largeur * f,
    height: OEIL.hauteur * f,
    borderRadius: 9,
    backgroundColor: encre,
  };
  const largeurSourire = SOURIRE.largeur * f;
  return (
    <YStack width={taille} height={taille} borderRadius="round" backgroundColor={fond} aria-hidden>
      <YStack {...oeil} left={OEIL.cote * k} />
      <YStack {...oeil} right={OEIL.cote * k} />
      <YStack
        position="absolute"
        top={SOURIRE.haut * k}
        left={(taille - largeurSourire) / 2}
        width={largeurSourire}
        height={SOURIRE.hauteur * f}
        borderWidth={Math.max(1.5, SOURIRE.trait * k)}
        borderTopWidth={0}
        borderColor={encre}
        borderBottomLeftRadius={SOURIRE.largeur * f}
        borderBottomRightRadius={SOURIRE.largeur * f}
      />
    </YStack>
  );
}
