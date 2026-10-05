import { haversineMeters } from './geo';
import type { LatLng } from './geo';

export interface Airport extends LatLng {
  /** IATA code, e.g. 'LIS'. */
  code: string;
}

export interface Region {
  slug: string;
  name: string;
  country: string;
  flag: string;
  center: LatLng;
  /** The nearest airport, where an arrival flight lands. */
  airport: Airport;
  /** The city has its own airport (Lisbon, Porto). Without one you arrive by train or coach. */
  hasAirport: boolean;
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
  airport: Airport,
  hasAirport = false,
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
    airport,
    hasAirport,
    bbox: [round(lat - dLat), round(lng - dLng), round(lat + dLat), round(lng + dLng)],
  };
}

/**
 * Launch regions: Portugal only until players prove they come back (Phase 10). Sintra stays first:
 * it's the pilot and the demo's default. Adding a city is a data change here plus a region row.
 */
export const REGIONS: readonly Region[] = [
  {
    ...r('sintra', 'Sintra', 'Portugal', '🇵🇹', 38.7975, -9.3905, {
      code: 'LIS',
      lat: 38.7742,
      lng: -9.1342,
    }),
    bbox: [38.73, -9.52, 38.85, -9.3],
  },
  {
    ...r(
      'lisbon',
      'Lisbon',
      'Portugal',
      '🇵🇹',
      38.7139,
      -9.1394,
      { code: 'LIS', lat: 38.7742, lng: -9.1342 },
      true,
    ),
    // West to Carcavelos, so the palaces and beaches along the Tagus line count as Lisbon.
    bbox: [38.614, -9.34, 38.814, -8.989],
  },
  r(
    'porto',
    'Porto',
    'Portugal',
    '🇵🇹',
    41.1496,
    -8.611,
    { code: 'OPO', lat: 41.2481, lng: -8.6814 },
    true,
  ),
  r('evora', 'Évora', 'Portugal', '🇵🇹', 38.5714, -7.9135, {
    code: 'LIS',
    lat: 38.7742,
    lng: -9.1342,
  }),
  r('aveiro', 'Aveiro', 'Portugal', '🇵🇹', 40.6405, -8.6538, {
    code: 'OPO',
    lat: 41.2481,
    lng: -8.6814,
  }),
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

export type TripMode = 'plane' | 'train' | 'bus';

/** Door-to-door minutes by train and by coach between two launch cities (either order). */
const GROUND_MINUTES: Record<string, { train: number; bus: number }> = {
  'lisbon|sintra': { train: 40, bus: 50 },
  'porto|sintra': { train: 210, bus: 240 },
  'evora|sintra': { train: 140, bus: 130 },
  'aveiro|sintra': { train: 180, bus: 225 },
  'evora|lisbon': { train: 90, bus: 105 },
  'aveiro|lisbon': { train: 135, bus: 180 },
  'lisbon|porto': { train: 170, bus: 210 },
  'evora|porto': { train: 285, bus: 255 },
  'aveiro|porto': { train: 60, bus: 75 },
  'aveiro|evora': { train: 255, bus: 225 },
};
/** Lisbon ↔ Porto by air. */
export const FLIGHT_MINUTES = 55;

export function groundMinutes(a: string, b: string): { train: number; bus: number } | undefined {
  return GROUND_MINUTES[[a, b].sort().join('|')];
}

/**
 * How you'd get between two cities: a flight when both have their own airport, otherwise
 * whichever of train or coach is quicker.
 */
export function tripMode(from: Region, to: Region): { mode: TripMode; minutes: number } {
  const ground = groundMinutes(from.slug, to.slug);
  if (from.hasAirport && to.hasAirport) return { mode: 'plane', minutes: FLIGHT_MINUTES };
  if (!ground) return { mode: 'train', minutes: 0 };
  return ground.bus < ground.train
    ? { mode: 'bus', minutes: ground.bus }
    : { mode: 'train', minutes: ground.train };
}

/**
 * Did the player travel? True whenever they were last seen in another launch city: they fly,
 * take the train or the coach there (tripMode). Mirrors check_arrival() in the database.
 */
export function arrivalTrip(
  previous: string | null | undefined,
  current: string | null | undefined,
): { from: Region; to: Region; km: number; mode: TripMode; minutes: number } | null {
  if (!previous || !current || previous === current) return null;
  const from = regionBySlug(previous);
  const to = regionBySlug(current);
  if (!from || !to) return null;
  return { from, to, km: haversineMeters(from.center, to.center) / 1000, ...tripMode(from, to) };
}
