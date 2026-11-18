import { createFont, createTamagui, createTokens, isWeb } from 'tamagui';
import { animations } from './animations';

// Mirrors design/handoff/reference/fixa.tamagui.config.ts with v3 hyphenated theme keys.
export const tokens = createTokens({
  space: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40, 9: 48, 10: 64 },
  size: { 0: 0, 1: 20, 2: 28, 3: 36, 4: 44, 5: 52, 6: 60 },
  radius: { 0: 0, 1: 6, 2: 10, 3: 14, 4: 16, 5: 24, 6: 32, round: 9999 },
  zIndex: { 0: 0, 1: 100, 2: 200, 3: 300, 4: 400, 5: 500 },
  color: {},
});

const size = {
  1: 11,
  2: 12,
  3: 13,
  4: 14,
  5: 16,
  6: 18,
  7: 20,
  8: 24,
  9: 28,
  10: 34,
  11: 44,
  12: 56,
  13: 68,
};
const weight = { 1: '300', 4: '400', 5: '500', 6: '600' } as const;
const face = {
  300: { normal: 'ReadexPro_300Light' },
  400: { normal: 'ReadexPro_400Regular' },
  500: { normal: 'ReadexPro_500Medium' },
  600: { normal: 'ReadexPro_600SemiBold' },
};
const family = isWeb ? '"Readex Pro", system-ui, sans-serif' : 'ReadexPro_400Regular';

export const ESPACEMENT_LETTRES: Readonly<Record<string, number>> = {
  4: 0,
  8: -0.2,
  9: -0.5,
  10: -0.7,
  11: -1,
  12: -1.6,
  13: -2.4,
};

const body = createFont({
  family,
  size,
  lineHeight: {
    1: 14,
    2: 16,
    3: 18,
    4: 20,
    5: 22,
    6: 24,
    7: 26,
    8: 30,
    9: 34,
    10: 40,
    11: 50,
    12: 62,
    13: 72,
  },
  weight,
  letterSpacing: ESPACEMENT_LETTRES,
  face,
});

// Arabic keeps the sizes, takes taller lines and never negative letter spacing.
const bodyAr = createFont({
  family,
  size,
  lineHeight: {
    1: 18,
    2: 20,
    3: 22,
    4: 24,
    5: 28,
    6: 30,
    7: 32,
    8: 36,
    9: 42,
    10: 48,
    11: 58,
    12: 74,
    13: 90,
  },
  weight,
  letterSpacing: { 4: 0 },
  face,
});

const light = {
  background: '#FBF6F1',
  'background-soft': '#F4EBE2',
  'background-press': '#ECDFD3',
  'background-hover': '#F4EBE2',
  'background-focus': '#F4EBE2',
  surface: '#FFFCF9',
  'border-color': '#EADCCF',
  'border-color-hover': '#D8C5B5',
  'border-color-focus': '#BF5535',
  'outline-color': 'transparent',
  'border-strong': '#D8C5B5',
  color: '#2B201B',
  'color-muted': '#6D5F56',
  'color-subtle': '#9C8D83',
  'placeholder-color': '#9C8D83',
  primary: '#BF5535',
  'primary-press': '#A6462A',
  'primary-soft': '#FBE5DA',
  'on-primary-soft': '#9A3F24',
  'on-primary': '#FFFFFF',
  accent: '#F2A273',
  'accent-soft': '#FDEBDD',
  secondary: '#3A6B96',
  'secondary-soft': '#E2ECF5',
  pending: '#93620A',
  'pending-soft': '#FBEFD3',
  confirmed: '#3A6B96',
  'confirmed-soft': '#E2ECF5',
  completed: '#2F7A4B',
  'completed-soft': '#DFF0E4',
  cancelled: '#AE3448',
  'cancelled-soft': '#F9E1E4',
  cat1: '#2F6E98',
  'cat1-soft': '#E1EEF6',
  cat2: '#94650C',
  'cat2-soft': '#FBEFD2',
  cat3: '#2E7A50',
  'cat3-soft': '#E0F1E7',
  cat4: '#4F4F8E',
  'cat4-soft': '#E8E7F3',
  cat5: '#A8405A',
  'cat5-soft': '#F9E3E8',
  cat6: '#2A7676',
  'cat6-soft': '#DFF0EF',
  star: '#E3A13B',
  'assistant-face': '#F2A273',
  'assistant-ink': '#4A2516',
  overlay: 'rgba(43,32,27,0.45)',
  'shadow-color': 'rgba(92,52,30,0.12)',
};

const dark: typeof light = {
  background: '#1A1512',
  'background-soft': '#28211C',
  'background-press': '#332A24',
  'background-hover': '#28211C',
  'background-focus': '#28211C',
  surface: '#221C18',
  'border-color': '#3A302A',
  'border-color-hover': '#4E423A',
  'border-color-focus': '#EE8A64',
  'outline-color': 'transparent',
  'border-strong': '#4E423A',
  color: '#F6EEE7',
  'color-muted': '#C2B4A9',
  'color-subtle': '#8E8076',
  'placeholder-color': '#8E8076',
  primary: '#EE8A64',
  'primary-press': '#F49D7B',
  'primary-soft': '#3F271E',
  'on-primary-soft': '#F6AE8F',
  'on-primary': '#2A140C',
  accent: '#F2A273',
  'accent-soft': '#3D2A1D',
  secondary: '#8FB8DE',
  'secondary-soft': '#1E2B38',
  pending: '#EBC06A',
  'pending-soft': '#372A12',
  confirmed: '#8FB8DE',
  'confirmed-soft': '#1E2B38',
  completed: '#86CDA0',
  'completed-soft': '#18301F',
  cancelled: '#F08E9E',
  'cancelled-soft': '#3B1D23',
  cat1: '#8EC0E3',
  'cat1-soft': '#1C2C38',
  cat2: '#E9C26F',
  'cat2-soft': '#352A14',
  cat3: '#8DCFA8',
  'cat3-soft': '#1A3124',
  cat4: '#B4B3E6',
  'cat4-soft': '#26253A',
  cat5: '#EDA0B3',
  'cat5-soft': '#3A1F27',
  cat6: '#86CACA',
  'cat6-soft': '#183131',
  star: '#EDB45A',
  'assistant-face': '#F2A273',
  'assistant-ink': '#4A2516',
  overlay: 'rgba(0,0,0,0.6)',
  'shadow-color': 'rgba(0,0,0,0.40)',
};

type Theme = typeof light;

// Sub-themes for Bouton variants and status badges.
const sous = (t: Theme) => ({
  primary: {
    ...t,
    background: t.primary,
    'background-press': t['primary-press'],
    'background-hover': t['primary-press'],
    color: t['on-primary'],
  },
  soft: { ...t, background: t['primary-soft'], color: t['on-primary-soft'] },
  danger: { ...t, background: t['cancelled-soft'], color: t.cancelled },
  pending: { ...t, background: t['pending-soft'], color: t.pending },
  confirmed: { ...t, background: t['confirmed-soft'], color: t.confirmed },
  completed: { ...t, background: t['completed-soft'], color: t.completed },
  cancelled: { ...t, background: t['cancelled-soft'], color: t.cancelled },
});

const sousLight = sous(light);
const sousDark = sous(dark);

export const config = createTamagui({
  tokens,
  fonts: { body, heading: body, body_ar: bodyAr, heading_ar: bodyAr },
  themes: {
    light,
    dark,
    light_primary: sousLight.primary,
    light_soft: sousLight.soft,
    light_danger: sousLight.danger,
    light_pending: sousLight.pending,
    light_confirmed: sousLight.confirmed,
    light_completed: sousLight.completed,
    light_cancelled: sousLight.cancelled,
    dark_primary: sousDark.primary,
    dark_soft: sousDark.soft,
    dark_danger: sousDark.danger,
    dark_pending: sousDark.pending,
    dark_confirmed: sousDark.confirmed,
    dark_completed: sousDark.completed,
    dark_cancelled: sousDark.cancelled,
  },
  media: {
    sm: { maxWidth: 640 },
    md: { minWidth: 641, maxWidth: 1024 },
    lg: { minWidth: 1025 },
    xl: { minWidth: 1441 },
  },
  animations,
  settings: { disableSSR: true, defaultFont: 'body' },
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
