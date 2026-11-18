import type { TamaguiBuildOptions } from 'tamagui';

export default {
  config: '../../packages/ui/src/tamagui.config.ts',
  components: ['tamagui'],
  disableExtraction: true,
} satisfies TamaguiBuildOptions;
