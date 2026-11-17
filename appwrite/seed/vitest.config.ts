import { defineConfig } from 'vitest/config';

// Set in the main process so every worker inherits it, a server far from Tunis.
process.env.TZ = 'America/New_York';

export default defineConfig({});
