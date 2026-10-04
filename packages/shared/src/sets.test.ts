import { EUROPE_PLACES } from './europe-places';
import { REGIONS } from './regions';
import { CITY_SETS, SET_SIZE } from './sets';

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
});
