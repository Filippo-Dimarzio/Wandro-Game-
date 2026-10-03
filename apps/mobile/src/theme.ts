import { useColorScheme } from 'react-native';
import type { Category } from '@wandro/shared';

/**
 * Category colours: `color` is the ink (pins, chips, headings), `tint` the page wash
 * on that category's screens. Every ink passes WCAG AA (4.5:1) against white, its own
 * tint and the app background; see theme.test.ts.
 */
const lightCategory = {
  coast: { color: '#0B6FB8', tint: '#E5F2FC' }, // Wandro blue: sea and sky
  nature: { color: '#2E7D32', tint: '#E7F4E8' }, // forest green: Sintra hills
  heritage: { color: '#B4441A', tint: '#FBEBE3' }, // terracotta: palace walls and roofs
  culture: { color: '#7B3FC4', tint: '#F1E9FB' }, // violet: museums and art
  music_events: { color: '#C2185B', tint: '#FCE6EF' }, // magenta: nights out
  other: { color: '#0A706F', tint: '#E0F3F2' }, // deep teal: curiosities (the octopus)
} satisfies Record<Category, { color: string; tint: string }>;

const darkCategory: typeof lightCategory = {
  coast: { color: '#5FB4F0', tint: '#0F2A40' },
  nature: { color: '#6CC070', tint: '#132A17' },
  heritage: { color: '#F08A5D', tint: '#35190E' },
  culture: { color: '#B48BF0', tint: '#24173A' },
  music_events: { color: '#F06A9E', tint: '#361223' },
  other: { color: '#4FC8C4', tint: '#0F2C2C' },
};

const pick = (palette: typeof lightCategory, key: 'color' | 'tint') =>
  Object.fromEntries(Object.entries(palette).map(([k, v]) => [k, v[key]])) as Record<
    Category,
    string
  >;

export const lightColors = {
  accent: '#0B6FB8', // Wandro blue
  accentOn: '#FFFFFF',
  accentSoft: '#E5F2FC',
  gold: '#93600E',
  goldSoft: '#FFF4DE',
  danger: '#C53030',
  bg: '#F4F9FE', // airy blue-white
  surface: '#E9F3FB',
  card: '#FFFFFF',
  text: '#0E1A24',
  textMuted: '#4A5A68',
  border: '#D5E4F0',
  locked: '#8A938F', // grey pins for undiscovered places
  me: '#2B6CB0',
  fog: 'rgba(227, 238, 247, 0.82)',
  fogFill: '#E3EEF7',
  category: pick(lightCategory, 'color'),
  categoryTint: pick(lightCategory, 'tint'),
  /** Text/icon colour on a solid category colour. */
  onCategory: '#FFFFFF',
};

export const darkColors: typeof lightColors = {
  accent: '#5FB4F0',
  accentOn: '#04233A',
  accentSoft: '#0F2A40',
  gold: '#E8B04A',
  goldSoft: '#2E2410',
  danger: '#FC8181',
  bg: '#0E151C',
  surface: '#17212B',
  card: '#1B2631',
  text: '#EEF4F9',
  textMuted: '#A7B6C3',
  border: '#2A3946',
  locked: '#6F7975',
  me: '#63A4E8',
  fog: 'rgba(16, 24, 32, 0.78)',
  fogFill: '#101820',
  category: pick(darkCategory, 'color'),
  categoryTint: pick(darkCategory, 'tint'),
  onCategory: '#0E151C',
};

export type Colors = typeof lightColors;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? darkColors : lightColors;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 14, lg: 22, xl: 28, pill: 999 };

/** Soft card shadow used across screens. */
export const shadow = {
  shadowColor: '#0B3A5E',
  shadowOpacity: 0.08,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};
