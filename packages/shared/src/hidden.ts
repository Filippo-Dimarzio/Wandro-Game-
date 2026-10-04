import { GEMS_UNLOCK_AFTER, HIDDEN_REVEAL_RADIUS_M, NEARBY_RADIUS_M } from './constants';
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

/**
 * Cities whose hidden gems are open to you: you've discovered GEMS_UNLOCK_AFTER places there.
 * Mirrors knows_place() in the database.
 */
export function gemCities(places: Place[], discovered: ReadonlySet<string>): Set<string> {
  const counts = new Map<string, number>();
  for (const p of places)
    if (p.region && discovered.has(p.id)) counts.set(p.region, (counts.get(p.region) ?? 0) + 1);
  return new Set([...counts].filter(([, n]) => n >= GEMS_UNLOCK_AFTER).map(([r]) => r));
}

/** Discoveries still needed in a city before its hidden gems appear (0 once open). */
export function gemsLeftToUnlock(
  places: Place[],
  discovered: ReadonlySet<string>,
  region: string,
): number {
  const n = places.filter((p) => p.region === region && discovered.has(p.id)).length;
  return Math.max(0, GEMS_UNLOCK_AFTER - n);
}

/** Places the player may see: hidden ones once revealed, discovered, or their city is open. */
export function visiblePlaces(
  places: Place[],
  revealed: ReadonlySet<string>,
  discovered: ReadonlySet<string>,
): Place[] {
  const open = gemCities(places, discovered);
  return places.filter(
    (p) =>
      !p.hidden || revealed.has(p.id) || discovered.has(p.id) || (!!p.region && open.has(p.region)),
  );
}

function unrevealed(
  places: Place[],
  revealed: ReadonlySet<string>,
  discovered: ReadonlySet<string>,
) {
  const open = gemCities(places, discovered);
  return places.filter(
    (p) =>
      p.hidden && !revealed.has(p.id) && !discovered.has(p.id) && !(p.region && open.has(p.region)),
  );
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
