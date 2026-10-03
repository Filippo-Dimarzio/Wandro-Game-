import { haversineMeters } from './geo';
import { DEMO_PLACES } from './seed-places';
import { arrivalFlight, REGIONS, regionBySlug, regionFor } from './regions';

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
    expect(regionFor({ lat: 48.8584, lng: 2.2945 })?.slug).toBe('paris');
    expect(regionFor({ lat: 38.7876, lng: -9.3906 })?.slug).toBe('sintra');
    expect(regionFor({ lat: 38.6916, lng: -9.216 })?.slug).toBe('lisbon');
  });

  it('falls back to the nearest centre within the catchment, else null', () => {
    // Versailles: outside the Paris box but close to the centre.
    expect(regionFor({ lat: 48.8049, lng: 2.1204 })?.slug).toBe('paris');
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

  it('demo place ids are unique', () => {
    expect(new Set(DEMO_PLACES.map((p) => p.id)).size).toBe(DEMO_PLACES.length);
  });
});

describe('arrivalFlight', () => {
  it('flies between far-apart cities only', () => {
    const f = arrivalFlight('lisbon', 'paris');
    expect(f?.from.airport.code).toBe('LIS');
    expect(f?.to.airport.code).toBe('CDG');
    expect(f!.km).toBeGreaterThan(1400);
    expect(arrivalFlight('sintra', 'lisbon')).toBeNull();
    expect(arrivalFlight('paris', 'paris')).toBeNull();
    expect(arrivalFlight(null, 'paris')).toBeNull();
    expect(arrivalFlight('paris', null)).toBeNull();
  });

  it('every city has an airport within 40 km', () => {
    for (const r of REGIONS) {
      expect(r.airport.code).toMatch(/^[A-Z]{3}$/);
      expect(haversineMeters(r.center, r.airport)).toBeLessThan(40_000);
    }
  });
});
