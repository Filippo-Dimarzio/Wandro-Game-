import { CATEGORIES } from '../constants';
import { DEMO_PLACES } from '../seed-places';
import { regionFor } from '../regions';
import { CITY_SETS } from '../sets';
import { ALGARVE_PLACES } from './algarve';

describe('the Algarve', () => {
  it('has at least five challenges in every category, like the other cities', () => {
    for (const cat of CATEGORIES)
      expect(
        ALGARVE_PLACES.filter((p) => p.category === cat && !p.hidden).length,
      ).toBeGreaterThanOrEqual(5);
  });

  it('has a few surfing and water challenges on the coast', () => {
    const water = ALGARVE_PLACES.filter((p) =>
      /surf|kayak|paddle|snorkel|kitesurf|bodyboard|boat/i.test(p.description ?? ''),
    );
    expect(water.length).toBeGreaterThanOrEqual(5);
    expect(water.filter((p) => /surf/i.test(p.description ?? '')).length).toBeGreaterThanOrEqual(3);
  });

  it('every challenge is in English with a quest, inside the region, and in the demo', () => {
    for (const p of ALGARVE_PLACES) {
      expect(p.description).toMatch(/Quest: /);
      expect(regionFor(p)?.slug).toBe('algarve');
      expect(DEMO_PLACES.some((d) => d.id === p.id)).toBe(true);
    }
  });

  it('has two hidden gems and two city sets', () => {
    expect(ALGARVE_PLACES.filter((p) => p.hidden)).toHaveLength(2);
    expect(CITY_SETS.filter((s) => s.region === 'algarve').map((s) => s.slug)).toEqual([
      'algarve-icons',
      'algarve-art',
    ]);
  });
});
