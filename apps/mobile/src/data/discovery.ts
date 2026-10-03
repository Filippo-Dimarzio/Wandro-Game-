import { haversineMeters, pointsForVisit, type LatLng, type Place } from '@wandro/shared';

export interface NearestResult {
  place: Place;
  distanceM: number;
  inRange: boolean;
}

/** Nearest locked place and whether the user is within its geofence (accuracy-tolerant). */
export function nearestLocked(
  position: LatLng,
  accuracyM: number | null,
  places: Place[],
  unlockedIds: Set<string>,
): NearestResult | null {
  let best: NearestResult | null = null;
  for (const place of places) {
    if (unlockedIds.has(place.id)) continue;
    const distanceM = haversineMeters(position, place);
    if (!best || distanceM < best.distanceM) {
      const tolerance = Math.min(accuracyM ?? 0, 25);
      best = { place, distanceM, inRange: distanceM <= place.geofenceRadiusM + tolerance };
    }
  }
  return best;
}

export function demoVisitPoints(place: Place): number {
  return pointsForVisit(place.category, place.uniqueVisitors, place.basePoints).total;
}
