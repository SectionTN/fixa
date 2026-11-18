import type { ComponentProps } from 'react';
import { styled, Text } from 'tamagui';
import { ESPACEMENT_LETTRES } from './tamagui.config';

// Native Text gets no family from settings.defaultFont, so every app text goes through this.
const TexteBrut = styled(Text, { fontFamily: 'body' });

export type TexteProps = ComponentProps<typeof TexteBrut>;

// A token fontSize also takes that size's letter spacing, which the fontSize prop alone never applies.
export function Texte(props: TexteProps) {
  const { fontSize, letterSpacing } = props;
  const parTaille =
    typeof fontSize === 'string' ? ESPACEMENT_LETTRES[fontSize.replace(/^\$/, '')] : undefined;
  return <TexteBrut {...props} letterSpacing={letterSpacing ?? parTaille} />;
}
