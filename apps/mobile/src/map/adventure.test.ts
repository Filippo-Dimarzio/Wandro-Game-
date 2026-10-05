import { ADVENTURE } from './adventure';

describe('game map palette', () => {
  it('keeps the mist light so places and names stay readable', () => {
    for (const p of [ADVENTURE.light, ADVENTURE.dark])
      expect(p.fogOpacity).toBeLessThanOrEqual(0.4);
  });

  it('keeps the street map colourful by day (blue water, green parks)', () => {
    expect(ADVENTURE.light.tiles.saturation).toBeGreaterThanOrEqual(0);
    expect(ADVENTURE.light.tiles.brightnessMax).toBe(1);
  });
});
