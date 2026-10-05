import { walkStep } from '@/lib/walk';
import { nearestOnLines, setStreetSnapper } from './streets';

const start = { lat: 38.8, lng: -9.39 };
const north = new Set(['up'] as const);

describe('walking along streets', () => {
  afterEach(() => setStreetSnapper(null));

  it('finds the nearest point on a street', () => {
    const best = nearestOnLines({ x: 5, y: 3 }, [
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
    ]);
    expect(best).toEqual({ point: { x: 5, y: 0 }, dist: 3 });
  });

  it('pulls each step onto the street', () => {
    const road = { lat: 38.80001, lng: -9.39002 };
    setStreetSnapper(() => road);
    expect(walkStep(start, north, 2)).toEqual(road);
  });

  it("doesn't walk through buildings: no street nearby, no move", () => {
    setStreetSnapper(() => null);
    expect(walkStep(start, north, 2)).toBe(start);
  });

  it('walks freely when the map has no street data', () => {
    setStreetSnapper(() => undefined);
    expect(walkStep(start, north, 2).lat).toBeGreaterThan(start.lat);
  });
});
