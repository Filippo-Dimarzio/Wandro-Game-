import { useColorScheme } from 'react-native';
import type { Category } from '@wandro/shared';

const shared = {
  accent: '#0E7C66', // octopus teal; 5.3:1 on white
  accentOn: '#FFFFFF',
  gold: '#B7791F',
  danger: '#C53030',
  category: {
    culture: '#6B46C1',
    heritage: '#B7791F',
    nature: '#2F855A',
    music_events: '#C05621',
    other: '#4A5568',
  } satisfies Record<Category, string>,
};

export const lightColors = {
  ...shared,
  bg: '#FFFFFF',
  surface: '#F4F5F2',
  card: '#FFFFFF',
  text: '#101412',
  textMuted: '#4A5551', // 7.6:1 on white
  border: '#DADFDC',
  locked: '#8A938F',
  fog: 'rgba(236, 233, 224, 0.82)',
};

export const darkColors: typeof lightColors = {
  ...shared,
  accent: '#3CC3A3',
  accentOn: '#06231C',
  bg: '#0B0F0E',
  surface: '#151B19',
  card: '#1A211F',
  text: '#EEF2F0',
  textMuted: '#A9B4B0',
  border: '#2A3330',
  locked: '#6F7975',
  fog: 'rgba(20, 24, 23, 0.78)',
};

export type Colors = typeof lightColors;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? darkColors : lightColors;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 14, lg: 22, pill: 999 };
