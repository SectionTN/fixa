import type { LayoutChangeEvent } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { XStack, type XStackProps } from 'tamagui';

// Room left under the footer's button once it sits on the open keyboard.
const ECART = 16;
// Room under the caret for the rest of a multiline field and its counter, above the lifted footer.
const AIR_MULTILIGNE = 130;
// Room under the caret of a one-line field, so short screens keep it below the header.
const AIR_LIGNE = 24;

const margeDe = (bas: number) => Math.max(bas, 16) + 8;

/** How far above the keyboard the focused field stays, so the lifted footer never covers it. */
export function decalageChamp(hauteurPied: number, bas: number, multiligne: boolean): number {
  return hauteurPied - (margeDe(bas) - ECART) + (multiligne ? AIR_MULTILIGNE : AIR_LIGNE);
}

/** A form screen's footer: it rides on the open keyboard, so its button stays in reach. */
export function PiedClavier({
  bas,
  onHauteur,
  children,
  ...props
}: XStackProps & { bas: number; onHauteur?: (hauteur: number) => void }) {
  const marge = margeDe(bas);
  return (
    // The keyboard already covers the bottom inset, so the footer drops by it when lifted.
    <KeyboardStickyView offset={{ opened: marge - ECART }}>
      <XStack
        paddingHorizontal="5"
        paddingBottom={marge}
        borderTopWidth={1}
        borderColor="border-color"
        backgroundColor="surface"
        onLayout={(e: LayoutChangeEvent) => onHauteur?.(e.nativeEvent.layout.height)}
        {...props}
      >
        {children}
      </XStack>
    </KeyboardStickyView>
  );
}
