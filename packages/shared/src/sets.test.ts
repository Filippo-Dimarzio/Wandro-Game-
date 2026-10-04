import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EUROPE_PLACES } from './europe-places';
import { REGIONS } from './regions';
import { CITY_SETS, SET_SIZE } from './sets';

const seed = readFileSync(
  join(__dirname, '..', '..', '..', 'supabase', 'seed', 'seed.sql'),
  'utf8',
);

describe('city sets', () => {
  it('every launch city outside Sintra has two sets of 5 visible places', () => {
    for (const r of REGIONS.filter((x) => x.slug !== 'sintra')) {
      const sets = CITY_SETS.filter((s) => s.region === r.slug);
      expect(sets).toHaveLength(2);
      for (const s of sets) {
        expect(s.placeIds).toHaveLength(SET_SIZE);
        expect(new Set(s.placeIds).size).toBe(SET_SIZE);
        for (const id of s.placeIds) {
          const p = EUROPE_PLACES.find((x) => x.id === id);
          expect(p?.region).toBe(r.slug);
          expect(p?.hidden).toBeFalsy();
        }
      }
    }
  });

  it('the seed has the same sets, places and order', () => {
    const rows = [...seed.matchAll(/^\('([a-z]+-(?:icons|art-rails))', '([a-z0-9-]+)', (\d+)\)/gm)];
    const fromSeed = new Map<string, string[]>();
    for (const [, slug, sourceId, pos] of rows) {
      const ids = fromSeed.get(slug) ?? [];
      ids[Number(pos) - 1] = `demo-${sourceId}`;
      fromSeed.set(slug, ids);
    }
    expect(Object.fromEntries(fromSeed)).toEqual(
      Object.fromEntries(CITY_SETS.map((s) => [s.slug, s.placeIds])),
    );
  });
});
