import { circleRing, fogPolygon } from './fog';
import { haversineMeters } from './geo';

describe('fog', () => {
  it('builds a closed circle of the requested radius', () => {
    const c = { lat: 38.79, lng: -9.39 };
    const ring = circleRing(c, 300);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    for (const [lng, lat] of ring) expect(haversineMeters(c, { lat, lng })).toBeCloseTo(300, -1);
  });
  it('adds one hole per unlocked place', () => {
    const f = fogPolygon([
      { lat: 38.79, lng: -9.39, radiusM: 100 },
      { lat: 38.8, lng: -9.4, radiusM: 100 },
    ]);
    expect(f.geometry.coordinates).toHaveLength(3);
  });
  it('covers everything when nothing is unlocked', () => {
    expect(fogPolygon([]).geometry.coordinates).toHaveLength(1);
  });
});
