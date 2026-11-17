import { styled, Text } from 'tamagui';

// Native Text gets no family from settings.defaultFont, so every app text goes through this.
export const Texte = styled(Text, { fontFamily: 'body' });
