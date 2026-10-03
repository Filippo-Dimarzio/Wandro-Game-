import { HIDDEN_REVEAL_RADIUS_M, NEARBY_RADIUS_M } from './constants';
import { haversineMeters } from './geo';
import type { LatLng } from './geo';
import type { Place } from './types';

/**
 * How close the nearest unrevealed gem is, in coarse steps so the hint can't be used to
 * triangulate it. Mirrors hidden_gem_hint() in the database.
 */
export type HiddenHint = 'very_close' | 'close' | 'walk' | 'area';

export function hintFor(distanceM: number): HiddenHint | null {
  if (distanceM <= 500) return 'very_close';
  if (distanceM <= 1000) return 'close';
  if (distanceM <= 3000) return 'walk';
  if (distanceM <= NEARBY_RADIUS_M) return 'area';
  return null;
}

/** Places the player may see: hidden ones only once revealed or discovered. */
export function visiblePlaces(
  places: Place[],
  revealed: ReadonlySet<string>,
  discovered: ReadonlySet<string>,
): Place[] {
  return places.filter((p) => !p.hidden || revealed.has(p.id) || discovered.has(p.id));
}

function unrevealed(
  places: Place[],
  revealed: ReadonlySet<string>,
  discovered: ReadonlySet<string>,
) {
  return places.filter((p) => p.hidden && !revealed.has(p.id) && !discovered.has(p.id));
}

/** The closest still-secret gem within the reveal radius, if any. Mirrors reveal_hidden_gem(). */
export function gemToReveal(
  places: Place[],
  position: LatLng,
  revealed: ReadonlySet<string>,
  discovered: ReadonlySet<string>,
): Place | null {
  let best: Place | null = null;
  let bestD = HIDDEN_REVEAL_RADIUS_M;
  for (const p of unrevealed(places, revealed, discovered)) {
    const d = haversineMeters(position, p);
    if (d <= bestD) {
      best = p;
      bestD = d;
    }
  }
  return best;
}

/** Number of secret gems in range and a coarse hint for the nearest one. */
export function hiddenGemHint(
  places: Place[],
  position: LatLng,
  revealed: ReadonlySet<string>,
  discovered: ReadonlySet<string>,
): { count: number; hint: HiddenHint | null } {
  const distances = unrevealed(places, revealed, discovered)
    .map((p) => haversineMeters(position, p))
    .filter((d) => d <= NEARBY_RADIUS_M);
  if (distances.length === 0) return { count: 0, hint: null };
  return { count: distances.length, hint: hintFor(Math.min(...distances)) };
}
