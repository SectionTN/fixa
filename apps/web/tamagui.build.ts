import type { TamaguiBuildOptions } from 'tamagui';

export default {
  config: '../../packages/ui/src/tamagui.config.ts',
  components: ['@fixa/ui', 'tamagui'],
  disableExtraction: true,
} satisfies TamaguiBuildOptions;
