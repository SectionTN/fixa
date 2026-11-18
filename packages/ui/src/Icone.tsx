import Svg, { Path } from 'react-native-svg';
import { isWeb, useTheme } from 'tamagui';
import { ICONES, type NomIcone } from './icones.generated';

export type IconeProps = {
  nom: NomIcone;
  taille?: number;
  /** A theme key such as 'primary', or any CSS colour. */
  couleur?: string;
};

// Icons are decoration: the control around them carries the label.
const MASQUE = isWeb ? { 'aria-hidden': true } : { accessible: false };

export function Icone({ nom, taille = 24, couleur = 'color' }: IconeProps) {
  const theme = useTheme() as Record<string, { get: () => unknown } | undefined>;
  const remplissage = String(theme[couleur]?.get() ?? couleur);
  return (
    <Svg width={taille} height={taille} viewBox="0 -960 960 960" {...MASQUE}>
      <Path d={ICONES[nom]} fill={remplissage} />
    </Svg>
  );
}
