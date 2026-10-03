import { ACCURACY_TOLERANCE_CAP_M, MAX_ACCURACY_M, MAX_PING_SPEED_MPS } from './constants';
import { haversineMeters, type LatLng } from './geo';

export interface Ping extends LatLng {
  accuracyM: number;
  isMocked: boolean;
  /** Milliseconds since epoch. */
  at: number;
}

export type CheckinVerdict =
  | { status: 'pending'; secondsLeft: number }
  | { status: 'verified' }
  | { status: 'rejected'; reason: 'left_geofence' }
  | { status: 'flagged'; reason: 'mock_location' | 'impossible_speed' };

export function isInsideGeofence(p: Ping, place: LatLng, radiusM: number): boolean {
  return (
    p.accuracyM <= MAX_ACCURACY_M &&
    haversineMeters(p, place) <= radiusM + Math.min(p.accuracyM, ACCURACY_TOLERANCE_CAP_M)
  );
}

/**
 * Same rules as supabase complete_checkin(): enough time, at least 3 pings with 80% inside the
 * geofence, still there near the end, no mock locations, no teleport jumps.
 */
export function evaluateCheckin(
  pings: Ping[],
  place: LatLng & { radiusM: number; dwellSeconds: number },
  startedAt: number,
  now: number,
): CheckinVerdict {
  const elapsed = Math.floor((now - startedAt) / 1000);
  if (elapsed < place.dwellSeconds)
    return { status: 'pending', secondsLeft: place.dwellSeconds - elapsed };

  const sorted = [...pings].sort((a, b) => a.at - b.at);
  const inside = sorted.filter((p) => isInsideGeofence(p, place, place.radiusM));
  const lastInside = inside.length ? inside[inside.length - 1].at : 0;
  if (
    sorted.length < 3 ||
    inside.length < 3 ||
    inside.length / sorted.length < 0.8 ||
    lastInside < startedAt + place.dwellSeconds * 800
  ) {
    return { status: 'rejected', reason: 'left_geofence' };
  }
  if (sorted.some((p) => p.isMocked)) return { status: 'flagged', reason: 'mock_location' };
  for (let i = 1; i < sorted.length; i++) {
    const dt = (sorted[i].at - sorted[i - 1].at) / 1000;
    if (dt > 0 && haversineMeters(sorted[i], sorted[i - 1]) / dt > MAX_PING_SPEED_MPS) {
      return { status: 'flagged', reason: 'impossible_speed' };
    }
  }
  return { status: 'verified' };
}
