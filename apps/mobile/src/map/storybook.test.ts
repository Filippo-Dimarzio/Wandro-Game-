import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { STORYBOOK, storybookPaint, storybookStyle } from './storybook';

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x! + 0.05) / (y! + 0.05);
};

describe('storybook map style', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`is a valid map style (${theme})`, () => {
      // validateStyleMin skips network checks; the cast matches its StyleSpecification input.
      const errors = validateStyleMin(storybookStyle(STORYBOOK[theme]) as never);
      expect(errors).toEqual([]);
    });

    it(`labels stay readable on the ground and their halo (${theme})`, () => {
      const p = STORYBOOK[theme];
      expect(contrast(p.label, p.ground)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.label, p.halo)).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('every themed paint value targets a layer in the style', () => {
    const ids = (storybookStyle(STORYBOOK.light).layers as { id: string }[]).map((l) => l.id);
    for (const [layer] of storybookPaint(STORYBOOK.light)) expect(ids).toContain(layer);
  });

  it('parks, water and ground are clearly different colours', () => {
    const p = STORYBOOK.light;
    expect(new Set([p.ground, p.park, p.water, p.street]).size).toBe(4);
  });
});
