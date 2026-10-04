import {
  gemCities,
  gemsLeftToUnlock,
  gemToReveal,
  hiddenGemHint,
  hintFor,
  visiblePlaces,
} from './hidden';
import { DEMO_PLACES } from './seed-places';
import type { Place } from './types';

const base = {
  description: '',
  category: 'other',
  geofenceRadiusM: 75,
  basePoints: 60,
  uniqueVisitors: 0,
} as const;
// ~111 m per 0.001° of latitude.
const open: Place = { ...base, id: 'open', name: 'Open', lat: 38.8, lng: -9.39 };
const gemA: Place = { ...base, id: 'a', name: 'A', lat: 38.8015, lng: -9.39, hidden: true }; // ~167 m
const gemB: Place = { ...base, id: 'b', name: 'B', lat: 38.81, lng: -9.39, hidden: true }; // ~1.1 km
const places = [open, gemA, gemB];
const here = { lat: 38.8, lng: -9.39 };
const none = new Set<string>();

describe('hidden gems', () => {
  it('hides gems until revealed or discovered', () => {
    expect(visiblePlaces(places, none, none).map((p) => p.id)).toEqual(['open']);
    expect(visiblePlaces(places, new Set(['a']), none).map((p) => p.id)).toEqual(['open', 'a']);
    expect(visiblePlaces(places, none, new Set(['b'])).map((p) => p.id)).toEqual(['open', 'b']);
  });

  it('reveals the closest gem within 200 m only', () => {
    expect(gemToReveal(places, here, none, none)?.id).toBe('a');
    expect(gemToReveal(places, here, new Set(['a']), none)).toBeNull();
    expect(gemToReveal(places, { lat: 38.79, lng: -9.39 }, none, none)).toBeNull();
  });

  it('gives a coarse hint, never an exact distance', () => {
    expect(hintFor(120)).toBe('very_close');
    expect(hintFor(900)).toBe('close');
    expect(hintFor(2500)).toBe('walk');
    expect(hintFor(20_000)).toBe('area');
    expect(hintFor(40_000)).toBeNull();
    expect(hiddenGemHint(places, here, none, none)).toEqual({ count: 2, hint: 'very_close' });
    expect(hiddenGemHint(places, here, new Set(['a']), none)).toEqual({ count: 1, hint: 'walk' });
    expect(hiddenGemHint(places, here, new Set(['a', 'b']), none)).toEqual({
      count: 0,
      hint: null,
    });
  });
});

describe('gems open after five discoveries in a city', () => {
  const evora = DEMO_PLACES.filter((p) => p.region === 'evora');
  const gems = evora.filter((p) => p.hidden);
  const five = evora
    .filter((p) => !p.hidden)
    .slice(0, 5)
    .map((p) => p.id);

  it('keeps gems secret until the fifth discovery, then shows them all', () => {
    const four = new Set(five.slice(0, 4));
    expect(gems.length).toBeGreaterThanOrEqual(2);
    expect(gemsLeftToUnlock(DEMO_PLACES, four, 'evora')).toBe(1);
    expect(visiblePlaces(DEMO_PLACES, new Set(), four).some((p) => p.hidden)).toBe(false);
    const all = new Set(five);
    expect(gemsLeftToUnlock(DEMO_PLACES, all, 'evora')).toBe(0);
    expect(gemCities(DEMO_PLACES, all)).toEqual(new Set(['evora']));
    const visible = visiblePlaces(DEMO_PLACES, new Set(), all);
    for (const g of gems) expect(visible).toContainEqual(g);
    // Other cities' gems stay hidden.
    expect(visible.some((p) => p.hidden && p.region !== 'evora')).toBe(false);
  });
});
