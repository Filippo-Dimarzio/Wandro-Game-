import { ADVENTURE, hatchPattern } from './adventure';

describe('adventure map palette', () => {
  it('hatches uncharted land with fine diagonal lines on parchment', () => {
    const px = hatchPattern(ADVENTURE.light, 16);
    expect(px).toHaveLength(16 * 16 * 4);
    const at = (x: number, y: number) =>
      Array.from(px.slice((y * 16 + x) * 4, (y * 16 + x) * 4 + 4));
    expect(at(0, 0)).toEqual([0xc6, 0xa4, 0x67, 255]); // a line
    expect(at(4, 0)).toEqual([0xd8, 0xbf, 0x86, 255]); // parchment
  });

  it('keeps the tiles readable in both themes', () => {
    for (const p of [ADVENTURE.light, ADVENTURE.dark]) {
      expect(p.tiles.opacity).toBeGreaterThanOrEqual(0.7);
      expect(p.tiles.saturation).toBeGreaterThan(-0.6);
    }
  });
});
