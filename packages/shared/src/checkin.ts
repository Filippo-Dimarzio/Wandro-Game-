import { ACCURACY_TOLERANCE_CAP_M, MAX_ACCURACY_M, MAX_PING_SPEED_MPS } from './constants';
import { haversineMeters, type LatLng } from './geo';

export interface Ping extends LatLng {
  accuracyM: number;
  isMocked: boolean;
  /** Milliseconds since epoch. */
  at: number;
}

export type CheckinVerdict =
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
 * Same rules as supabase complete_checkin(): no waiting, you only need to be there now (your
 * latest location fix inside the geofence with good accuracy). Mock locations and teleport
 * jumps between fixes are held for review.
 */
export function evaluateCheckin(
  pings: Ping[],
  place: LatLng & { radiusM: number },
): CheckinVerdict {
  const sorted = [...pings].sort((a, b) => a.at - b.at);
  const last = sorted[sorted.length - 1];
  if (!last || !isInsideGeofence(last, place, place.radiusM)) {
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
