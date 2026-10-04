import { CATEGORIES } from './constants';
import { haversineMeters } from './geo';
import { DEMO_PLACES } from './seed-places';
import { arrivalFlight, REGIONS, regionBySlug, regionFor } from './regions';

describe('regions', () => {
  it('are Sintra, Lisbon and Porto, with Sintra first', () => {
    expect(REGIONS.map((r) => r.slug)).toEqual(['sintra', 'lisbon', 'porto']);
    expect(REGIONS.every((r) => r.country === 'Portugal')).toBe(true);
  });

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
    expect(regionFor({ lat: 41.1405, lng: -8.611 })?.slug).toBe('porto');
    expect(regionFor({ lat: 38.7876, lng: -9.3906 })?.slug).toBe('sintra');
    expect(regionFor({ lat: 38.6916, lng: -9.216 })?.slug).toBe('lisbon');
  });

  it('falls back to the nearest centre within the catchment, else null', () => {
    // Matosinhos beach: outside the Porto box but close to the centre.
    expect(regionFor({ lat: 41.18, lng: -8.775 })?.slug).toBe('porto');
    // Paris is no longer a launch city.
    expect(regionFor({ lat: 48.8584, lng: 2.2945 })).toBeNull();
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

describe('arrivalFlight', () => {
  it('flies between cities with different airports only', () => {
    const f = arrivalFlight('lisbon', 'porto');
    expect(f?.from.airport.code).toBe('LIS');
    expect(f?.to.airport.code).toBe('OPO');
    expect(f!.km).toBeGreaterThan(250);
    expect(arrivalFlight('porto', 'sintra')?.to.airport.code).toBe('LIS');
    // Sintra and Lisbon share LIS: a train ride, not a flight.
    expect(arrivalFlight('sintra', 'lisbon')).toBeNull();
    expect(arrivalFlight('lisbon', 'sintra')).toBeNull();
    expect(arrivalFlight('porto', 'porto')).toBeNull();
    expect(arrivalFlight(null, 'porto')).toBeNull();
    expect(arrivalFlight('porto', null)).toBeNull();
    expect(arrivalFlight('paris', 'porto')).toBeNull();
  });

  it('only Portuguese airports are used', () => {
    expect([...new Set(REGIONS.map((r) => r.airport.code))].sort()).toEqual(['LIS', 'OPO']);
  });

  it('every city has an airport within 40 km', () => {
    for (const r of REGIONS) {
      expect(r.airport.code).toMatch(/^[A-Z]{3}$/);
      expect(haversineMeters(r.center, r.airport)).toBeLessThan(40_000);
    }
  });
});
