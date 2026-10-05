import { DEMO_PLACES, REGIONS } from '@wandro/shared';
import { LANDMARK_MARKERS, LANDMARK_NAMES, landmarkOf } from './markers';
import { placesGeoJson } from './useFog';

describe('landmark pins', () => {
  it('every city has a signature landmark that exists, with a badge', () => {
    for (const r of REGIONS) {
      const name = LANDMARK_NAMES[r.slug];
      const place = DEMO_PLACES.find((p) => p.region === r.slug && p.name === name);
      expect(place).toBeDefined();
      expect(place!.hidden).toBeFalsy();
      expect(landmarkOf(place!)).toBe(r.slug);
      expect(LANDMARK_MARKERS[r.slug]).toBeDefined();
    }
  });

  it('only marks the signature landmark, and tells the map which pin to use', () => {
    const pena = DEMO_PLACES.find((p) => p.id === 'demo-pena')!;
    const mouros = DEMO_PLACES.find((p) => p.id === 'demo-mouros')!;
    const fc = placesGeoJson([pena, mouros], new Set(['demo-mouros']));
    expect(fc.features.map((f) => f.properties)).toEqual([
      expect.objectContaining({ landmark: 'sintra', unlocked: false }),
      expect.objectContaining({ landmark: '', unlocked: true, category: mouros.category }),
    ]);
  });
});
