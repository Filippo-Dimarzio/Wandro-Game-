import { DEMO_PLACES } from '@wandro/shared';
import { nearestLocked } from './discovery';

const pena = DEMO_PLACES.find((p) => p.id === 'demo-pena')!;

describe('nearestLocked', () => {
  it('finds the closest locked place and checks the geofence', () => {
    const r = nearestLocked({ lat: pena.lat, lng: pena.lng }, 5, DEMO_PLACES, new Set());
    expect(r?.place.id).toBe('demo-pena');
    expect(r?.inRange).toBe(true);
  });

  it('skips places already discovered', () => {
    const r = nearestLocked(
      { lat: pena.lat, lng: pena.lng },
      5,
      DEMO_PLACES,
      new Set(['demo-pena']),
    );
    expect(r?.place.id).not.toBe('demo-pena');
  });

  it('is out of range ~150 m away even with poor accuracy (tolerance is capped)', () => {
    const r = nearestLocked({ lat: pena.lat + 0.00135, lng: pena.lng }, 500, [pena], new Set());
    expect(r?.inRange).toBe(false);
  });

  it('returns null when everything is discovered', () => {
    expect(nearestLocked({ lat: 0, lng: 0 }, null, [pena], new Set([pena.id]))).toBeNull();
  });
});
