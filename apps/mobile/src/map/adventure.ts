/**
 * The adventure-map look: a sepia, treasure-map palette. Explored ground shows the real map
 * (roads and names stay readable); unexplored ground is hatched parchment, like the uncharted
 * edges of an old chart.
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
    paper: '#E9D7AE',
    fog: '#D8BF86',
    hatch: '#C6A467',
    ink: '#5A3A14',
    tiles: { opacity: 0.74, saturation: -0.45, contrast: 0.12, brightnessMax: 1 },
  },
  dark: {
    paper: '#2B2116',
    fog: '#1D1610',
    hatch: '#4A3820',
    ink: '#E3C48A',
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
