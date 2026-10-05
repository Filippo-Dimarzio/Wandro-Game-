import { CATEGORIES } from './constants';
import { haversineMeters } from './geo';
import { DEMO_PLACES } from './seed-places';
import { EUROPE_PLACES } from './europe-places';
import {
  arrivalTrip,
  FLIGHT_MINUTES,
  groundMinutes,
  REGIONS,
  regionBySlug,
  regionFor,
} from './regions';

describe('regions', () => {
  it('have unique slugs and sensible boxes', () => {
    expect(new Set(REGIONS.map((r) => r.slug)).size).toBe(REGIONS.length);
    for (const { bbox, center } of REGIONS) {
      const [s, w, n, e] = bbox;
      expect(s).toBeLessThan(n);
      expect(w).toBeLessThan(e);
      expect(center.lat).toBeGreaterThan(s);
      expect(center.lat).toBeLessThan(n);
    }
  });

  it('finds the region for a point inside a box', () => {
    expect(regionFor({ lat: 41.1407, lng: -8.6131 })?.slug).toBe('porto');
    expect(regionFor({ lat: 38.5728, lng: -7.9073 })?.slug).toBe('evora');
    expect(regionFor({ lat: 40.6405, lng: -8.6538 })?.slug).toBe('aveiro');
    expect(regionFor({ lat: 38.7876, lng: -9.3906 })?.slug).toBe('sintra');
    expect(regionFor({ lat: 38.6916, lng: -9.216 })?.slug).toBe('lisbon');
  });

  it('falls back to the nearest centre within the catchment, else null', () => {
    // Setúbal: outside the Lisbon box but within reach of its centre.
    expect(regionFor({ lat: 38.5244, lng: -8.8882 })?.slug).toBe('lisbon');
    // Middle of the Atlantic.
    expect(regionFor({ lat: 40, lng: -30 })).toBeNull();
  });

  it('every demo place lies in the region it claims', () => {
    for (const p of DEMO_PLACES) {
      expect(p.region).toBeDefined();
      const region = regionBySlug(p.region!);
      expect(region).toBeDefined();
      expect(regionFor(p)?.slug).toBe(p.region);
    }
  });

  it('every region has places and at least one hidden gem', () => {
    for (const { slug } of REGIONS) {
      const here = DEMO_PLACES.filter((p) => p.region === slug);
      expect(here.length).toBeGreaterThanOrEqual(4);
      expect(here.some((p) => p.hidden)).toBe(true);
    }
  });

  it('every city has at least 5 visible places in every category', () => {
    for (const { slug } of REGIONS)
      for (const cat of CATEGORIES) {
        const n = DEMO_PLACES.filter(
          (p) => p.region === slug && p.category === cat && !p.hidden,
        ).length;
        expect([slug, cat, n >= 5]).toEqual([slug, cat, true]);
      }
  });

  it('places are at least 100 m apart, so check-ins are never ambiguous', () => {
    for (let i = 0; i < DEMO_PLACES.length; i++)
      for (let j = i + 1; j < DEMO_PLACES.length; j++)
        expect([
          DEMO_PLACES[i]!.id,
          DEMO_PLACES[j]!.id,
          haversineMeters(DEMO_PLACES[i]!, DEMO_PLACES[j]!) >= 100,
        ]).toEqual([DEMO_PLACES[i]!.id, DEMO_PLACES[j]!.id, true]);
  });

  it('demo place ids are unique', () => {
    expect(new Set(DEMO_PLACES.map((p) => p.id)).size).toBe(DEMO_PLACES.length);
  });
});

describe('Portugal focus', () => {
  it('launches in five Portuguese cities, Sintra first', () => {
    expect(REGIONS.map((r) => r.slug)).toEqual(['sintra', 'lisbon', 'porto', 'evora', 'aveiro']);
    expect(REGIONS.every((r) => r.country === 'Portugal')).toBe(true);
  });

  it('has no places outside the launch cities', () => {
    const live = new Set(REGIONS.map((r) => r.slug));
    expect(EUROPE_PLACES.every((p) => p.region && live.has(p.region))).toBe(true);
    expect(DEMO_PLACES.every((p) => !p.region || live.has(p.region))).toBe(true);
    expect(regionFor({ lat: 48.8584, lng: 2.2945 })).toBeNull();
  });
});

describe('arrivalTrip', () => {
  it('flies only between two cities with their own airport', () => {
    const f = arrivalTrip('lisbon', 'porto');
    expect(f).toMatchObject({ mode: 'plane', minutes: FLIGHT_MINUTES });
    expect(f!.km).toBeGreaterThan(250);
    expect(REGIONS.filter((r) => r.hasAirport).map((r) => r.slug)).toEqual(['lisbon', 'porto']);
  });

  it('takes the quicker of train and coach when a city has no airport', () => {
    expect(arrivalTrip('sintra', 'lisbon')).toMatchObject({ mode: 'train', minutes: 40 });
    expect(arrivalTrip('porto', 'aveiro')).toMatchObject({ mode: 'train', minutes: 60 });
    expect(arrivalTrip('evora', 'porto')).toMatchObject({ mode: 'bus', minutes: 255 });
    expect(arrivalTrip('sintra', 'evora')).toMatchObject({ mode: 'bus', minutes: 130 });
  });

  it('knows train and coach times for every pair of cities', () => {
    for (const a of REGIONS)
      for (const b of REGIONS) if (a !== b) expect(groundMinutes(a.slug, b.slug)).toBeDefined();
  });

  it('every change of city is a trip; staying put or unknown cities are not', () => {
    expect(arrivalTrip('porto', 'porto')).toBeNull();
    expect(arrivalTrip(null, 'porto')).toBeNull();
    expect(arrivalTrip('porto', null)).toBeNull();
    expect(arrivalTrip('paris', 'porto')).toBeNull();
  });

  it('only Portuguese airports are used', () => {
    expect([...new Set(REGIONS.map((r) => r.airport.code))].sort()).toEqual(['LIS', 'OPO']);
  });

  it('every city has an airport within 120 km (Évora flies into Lisbon)', () => {
    for (const r of REGIONS) {
      expect(r.airport.code).toMatch(/^[A-Z]{3}$/);
      expect(haversineMeters(r.center, r.airport)).toBeLessThan(120_000);
    }
  });
});
