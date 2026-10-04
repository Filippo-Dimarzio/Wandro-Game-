import { BASE_POINTS, DEFAULT_GEOFENCE_RADIUS_M } from './constants';
import type { Category, OpeningSlot, Place } from './types';

export function placeIn(
  region: string,
  id: string,
  name: string,
  category: Category,
  lat: number,
  lng: number,
  uniqueVisitors: number,
  description: string,
  opts: { hidden?: boolean; hours?: OpeningSlot[] } = {},
): Place {
  return {
    id: `demo-${id}`,
    region,
    name,
    description,
    category,
    lat,
    lng,
    geofenceRadiusM: DEFAULT_GEOFENCE_RADIUS_M,
    basePoints: BASE_POINTS[category],
    uniqueVisitors,
    ...(opts.hidden && { hidden: true }),
    ...(opts.hours && { hours: opts.hours }),
  };
}

/** One side quest: slug (prefixed with the city), name, category, position, visitors so far, quest text. */
export type Quest = readonly [
  slug: string,
  name: string,
  category: Category,
  lat: number,
  lng: number,
  visitors: number,
  quest: string,
  hidden?: 'hidden',
];

export function quests(region: string, list: readonly Quest[]): Place[] {
  return list.map(([slug, name, category, lat, lng, visitors, quest, hidden]) =>
    placeIn(region, `${region}-${slug}`, name, category, lat, lng, visitors, quest, {
      hidden: hidden === 'hidden',
    }),
  );
}
