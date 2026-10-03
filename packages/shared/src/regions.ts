import { haversineMeters } from './geo';
import type { LatLng } from './geo';

export interface Region {
  slug: string;
  name: string;
  country: string;
  flag: string;
  center: LatLng;
  /** south, west, north, east — the area the importer pulls places from. */
  bbox: readonly [number, number, number, number];
}

function r(
  slug: string,
  name: string,
  country: string,
  flag: string,
  lat: number,
  lng: number,
  dLat = 0.1,
  dLng = 0.15,
): Region {
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return {
    slug,
    name,
    country,
    flag,
    center: { lat, lng },
    bbox: [round(lat - dLat), round(lng - dLng), round(lat + dLat), round(lng + dLng)],
  };
}

/** Curated launch cities. Sintra stays first: it's the pilot and the demo's default. */
export const REGIONS: readonly Region[] = [
  {
    ...r('sintra', 'Sintra', 'Portugal', '🇵🇹', 38.7975, -9.3905),
    bbox: [38.73, -9.52, 38.85, -9.3],
  },
  r('lisbon', 'Lisbon', 'Portugal', '🇵🇹', 38.7139, -9.1394),
  r('porto', 'Porto', 'Portugal', '🇵🇹', 41.1496, -8.611),
  r('madrid', 'Madrid', 'Spain', '🇪🇸', 40.4168, -3.7038),
  r('barcelona', 'Barcelona', 'Spain', '🇪🇸', 41.3874, 2.1686),
  r('paris', 'Paris', 'France', '🇫🇷', 48.8566, 2.3522),
  r('rome', 'Rome', 'Italy', '🇮🇹', 41.8967, 12.4822),
  r('florence', 'Florence', 'Italy', '🇮🇹', 43.7696, 11.2558),
  r('amsterdam', 'Amsterdam', 'Netherlands', '🇳🇱', 52.3676, 4.9041),
  r('berlin', 'Berlin', 'Germany', '🇩🇪', 52.52, 13.405),
  r('prague', 'Prague', 'Czechia', '🇨🇿', 50.0755, 14.4378),
  r('vienna', 'Vienna', 'Austria', '🇦🇹', 48.2082, 16.3738),
  r('edinburgh', 'Edinburgh', 'United Kingdom', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 55.9533, -3.1883),
];

export const DEFAULT_REGION = REGIONS[0]!;

/** How far from a city centre still counts as "in" that city when outside its box. */
export const REGION_CATCHMENT_M = 40_000;

export function regionBySlug(slug: string): Region | undefined {
  return REGIONS.find((x) => x.slug === slug);
}

/** The region a point is in: inside a box wins, else the nearest centre within the catchment. */
export function regionFor(p: LatLng): Region | null {
  const inside = REGIONS.find(
    ({ bbox: [s, w, n, e] }) => p.lat >= s && p.lat <= n && p.lng >= w && p.lng <= e,
  );
  if (inside) return inside;
  let best: Region | null = null;
  let bestD = REGION_CATCHMENT_M;
  for (const region of REGIONS) {
    const d = haversineMeters(p, region.center);
    if (d <= bestD) {
      best = region;
      bestD = d;
    }
  }
  return best;
}
