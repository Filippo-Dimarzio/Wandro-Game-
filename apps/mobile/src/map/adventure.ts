/**
 * The game layer over the storybook map (map/storybook.ts): unexplored ground is a cream hatch,
 * like the unpainted edges of an illustrated map, while explored ground shows the full colours.
 * `tiles` styles the plain OpenStreetMap fallback used if the storybook tiles can't load.
 */
export interface AdventurePalette {
  paper: string;
  fog: string;
  hatch: string;
  ink: string;
  tiles: { opacity: number; saturation: number; contrast: number; brightnessMax: number };
}

export const ADVENTURE: Record<'light' | 'dark', AdventurePalette> = {
  light: {
    paper: '#F5D9BE',
    fog: '#F8ECDD',
    hatch: '#E9CDB0',
    ink: '#2F3E7A',
    tiles: { opacity: 0.74, saturation: -0.45, contrast: 0.12, brightnessMax: 1 },
  },
  dark: {
    paper: '#2A2236',
    fog: '#1F1A29',
    hatch: '#3A3048',
    ink: '#F2D9BE',
    tiles: { opacity: 0.7, saturation: -0.5, contrast: 0.1, brightnessMax: 0.55 },
  },
};

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

/** RGBA pixels for a small diagonal-hatch tile (fog pattern on the web map). */
export function hatchPattern(p: AdventurePalette, size = 16): Uint8Array {
  const [br, bg, bb] = hex(p.fog);
  const [lr, lg, lb] = hex(p.hatch);
  const px = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const line = (x + y) % 8 < 1.5;
      const i = (y * size + x) * 4;
      px[i] = line ? lr : br;
      px[i + 1] = line ? lg : bg;
      px[i + 2] = line ? lb : bb;
      px[i + 3] = 255;
    }
  return px;
}
