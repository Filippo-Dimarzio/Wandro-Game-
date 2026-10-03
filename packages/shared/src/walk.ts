import type { LatLng } from './geo';

/** Average walking speed used for ETAs (m/s). */
export const WALKING_SPEED_MPS = 1.3;
/** Within this distance of an undiscovered place, the app nudges you ("a gem is close"). */
export const NEARBY_NUDGE_M = 150;

/** Moves a position by metres east (dx) and north (dy). */
export function moveBy(p: LatLng, eastM: number, northM: number): LatLng {
  const lat = p.lat + northM / 111_320;
  const lng = p.lng + eastM / (111_320 * Math.cos((p.lat * Math.PI) / 180));
  return { lat, lng };
}

export function walkingMinutes(distanceM: number): number {
  return Math.max(1, Math.round(distanceM / WALKING_SPEED_MPS / 60));
}

export type Proximity = 'here' | 'close' | 'warmer' | 'far';

/** Find-My-style closeness: inside the geofence, within 3x, within 500 m, or further. */
export function proximity(distanceM: number, radiusM: number): Proximity {
  if (distanceM <= radiusM) return 'here';
  if (distanceM <= radiusM * 3) return 'close';
  if (distanceM <= 500) return 'warmer';
  return 'far';
}

/** Progress 0..1 from where the guidance started to the edge of the geofence. */
export function approachProgress(startM: number, nowM: number, radiusM: number): number {
  const total = Math.max(1, startM - radiusM);
  return Math.min(1, Math.max(0, (startM - nowM) / total));
}
