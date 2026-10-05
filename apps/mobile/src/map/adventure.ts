/**
 * The game-map look, after illustrated tourist maps: a clean, bright street map (blue water, green
 * parks) on warm paper, a light mist over places you haven't explored yet, and bold pins with
 * names so the landmarks to explore stand out. Fog never hides a place or its name.
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
    paper: '#F4EBD6',
    fog: '#EFE3C4',
    fogOpacity: 0.35,
    ink: '#5A3A14',
    tiles: { saturation: 0.2, contrast: 0.05, brightnessMax: 1 },
  },
  dark: {
    paper: '#1C232E',
    fog: '#0E1520',
    fogOpacity: 0.4,
    ink: '#E3C48A',
    tiles: { saturation: -0.2, contrast: 0, brightnessMax: 0.6 },
  },
};

/** How a place's name is drawn under its pin on the web map (pixel ratio 2). */
export const LABEL = {
  font: '700 22px system-ui, -apple-system, sans-serif',
  padX: 12,
  height: 34,
};
