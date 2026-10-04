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
  /** The city's main airport, where an arrival flight lands. */
  airport: Airport;
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
    bbox: [round(lat - dLat), round(lng - dLng), round(lat + dLat), round(lng + dLng)],
  };
}

/** Curated launch cities. Sintra stays first: it's the pilot and the demo's default. */
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
    ...r('lisbon', 'Lisbon', 'Portugal', '🇵🇹', 38.7139, -9.1394, {
      code: 'LIS',
      lat: 38.7742,
      lng: -9.1342,
    }),
    // West to Carcavelos, so the palaces and beaches along the Tagus line count as Lisbon.
    bbox: [38.614, -9.34, 38.814, -8.989],
  },
  r('porto', 'Porto', 'Portugal', '🇵🇹', 41.1496, -8.611, {
    code: 'OPO',
    lat: 41.2481,
    lng: -8.6814,
  }),
  r('madrid', 'Madrid', 'Spain', '🇪🇸', 40.4168, -3.7038, {
    code: 'MAD',
    lat: 40.4983,
    lng: -3.5676,
  }),
  r('barcelona', 'Barcelona', 'Spain', '🇪🇸', 41.3874, 2.1686, {
    code: 'BCN',
    lat: 41.2974,
    lng: 2.0833,
  }),
  r('paris', 'Paris', 'France', '🇫🇷', 48.8566, 2.3522, { code: 'CDG', lat: 49.0097, lng: 2.5479 }),
  r('rome', 'Rome', 'Italy', '🇮🇹', 41.8967, 12.4822, { code: 'FCO', lat: 41.8003, lng: 12.2389 }),
  r('florence', 'Florence', 'Italy', '🇮🇹', 43.7696, 11.2558, {
    code: 'FLR',
    lat: 43.81,
    lng: 11.2051,
  }),
  r('amsterdam', 'Amsterdam', 'Netherlands', '🇳🇱', 52.3676, 4.9041, {
    code: 'AMS',
    lat: 52.3105,
    lng: 4.7683,
  }),
  r('berlin', 'Berlin', 'Germany', '🇩🇪', 52.52, 13.405, {
    code: 'BER',
    lat: 52.3667,
    lng: 13.5033,
  }),
  r('prague', 'Prague', 'Czechia', '🇨🇿', 50.0755, 14.4378, {
    code: 'PRG',
    lat: 50.1008,
    lng: 14.26,
  }),
  r('vienna', 'Vienna', 'Austria', '🇦🇹', 48.2082, 16.3738, {
    code: 'VIE',
    lat: 48.1103,
    lng: 16.5697,
  }),
  r('edinburgh', 'Edinburgh', 'United Kingdom', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 55.9533, -3.1883, {
    code: 'EDI',
    lat: 55.95,
    lng: -3.3725,
  }),
  r('budapest', 'Budapest', 'Hungary', '🇭🇺', 47.4979, 19.0402, {
    code: 'BUD',
    lat: 47.4369,
    lng: 19.2556,
  }),
  {
    ...r('dublin', 'Dublin', 'Ireland', '🇮🇪', 53.3498, -6.2603, {
      code: 'DUB',
      lat: 53.4264,
      lng: -6.2499,
    }),
    // East to Howth and the Forty Foot, along the bay.
    bbox: [53.25, -6.41, 53.45, -6.0],
  },
  {
    ...r('cork', 'Cork', 'Ireland', '🇮🇪', 51.8985, -8.4756, {
      code: 'ORK',
      lat: 51.8413,
      lng: -8.4911,
    }),
    // The whole harbour: Cobh, Spike Island, Fota and Crosshaven.
    bbox: [51.77, -8.63, 52.0, -8.2],
  },
  r(
    'stockholm',
    'Stockholm',
    'Sweden',
    '🇸🇪',
    59.3293,
    18.0686,
    { code: 'ARN', lat: 59.6498, lng: 17.9238 },
    0.1,
    0.22,
  ),
  r('copenhagen', 'Copenhagen', 'Denmark', '🇩🇰', 55.6761, 12.5683, {
    code: 'CPH',
    lat: 55.618,
    lng: 12.6508,
  }),
  r('warsaw', 'Warsaw', 'Poland', '🇵🇱', 52.2297, 21.0122, {
    code: 'WAW',
    lat: 52.1657,
    lng: 20.9671,
  }),
  r('gdansk', 'Gdańsk', 'Poland', '🇵🇱', 54.352, 18.6466, {
    code: 'GDN',
    lat: 54.3776,
    lng: 18.4662,
  }),
  {
    ...r('basque', 'Basque Country', 'Spain', '🇪🇸', 43.263, -2.935, {
      code: 'BIO',
      lat: 43.3011,
      lng: -2.9106,
    }),
    // Bilbao to San Sebastián and the coast between them.
    bbox: [43.15, -3.1, 43.47, -1.75],
  },
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

/** Cities closer than this are a drive or a train ride, not a flight (Sintra ↔ Lisbon). */
export const MIN_FLIGHT_KM = 300;

/**
 * Did the player fly? True when they were last seen in another launch city at least
 * MIN_FLIGHT_KM away. Mirrors check_arrival() in the database.
 */
export function arrivalFlight(
  previous: string | null | undefined,
  current: string | null | undefined,
): { from: Region; to: Region; km: number } | null {
  if (!previous || !current || previous === current) return null;
  const from = regionBySlug(previous);
  const to = regionBySlug(current);
  if (!from || !to) return null;
  const km = haversineMeters(from.center, to.center) / 1000;
  return km >= MIN_FLIGHT_KM ? { from, to, km } : null;
}
