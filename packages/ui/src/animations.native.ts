import { createAnimations } from '@tamagui/animations-reanimated';

export const animations = createAnimations({
  rapide: { type: 'timing', duration: 150 },
  normal: { type: 'timing', duration: 250 },
  feuille: { type: 'spring', damping: 26, stiffness: 260, mass: 1 },
});
