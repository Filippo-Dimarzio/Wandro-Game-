/**
 * The game layer over the storybook map (map/storybook.ts): a light mist over places you haven't
 * explored yet (it never hides a place or its name), and bold pins (names show when you tap a pin). `tiles` styles
 * the plain OpenStreetMap fallback used if the storybook tiles can't load.
 */
export interface AdventurePalette {
  paper: string;
  fog: string;
  fogOpacity: number;
  ink: string;
  tiles: { saturation: number; contrast: number; brightnessMax: number };
}

export const ADVENTURE: Record<'light' | 'dark', AdventurePalette> = {
  light: {
    paper: '#F5D9BE',
    fog: '#F8ECDD',
    fogOpacity: 0.35,
    ink: '#2F3E7A',
    tiles: { saturation: 0.2, contrast: 0.05, brightnessMax: 1 },
  },
  dark: {
    paper: '#2A2236',
    fog: '#1F1A29',
    fogOpacity: 0.4,
    ink: '#F2D9BE',
    tiles: { saturation: -0.2, contrast: 0, brightnessMax: 0.6 },
  },
};
