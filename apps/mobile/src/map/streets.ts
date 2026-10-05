import type { LatLng } from '@wandro/shared';

/**
 * Finds the nearest point on a street, for walking the octopus along roads in demo mode.
 * Returns that point, `null` when streets are drawn but none is within `maxM`, or `undefined`
 * when the map can't tell (no street data loaded, e.g. on phones or with the fallback map), in
 * which case walking stays free.
 */
export type StreetSnapper = (p: LatLng, maxM: number) => LatLng | null | undefined;

let snapper: StreetSnapper | null = null;

/** The map registers itself while it's on screen. */
export function setStreetSnapper(fn: StreetSnapper | null) {
  snapper = fn;
}

export function snapToStreet(p: LatLng, maxM: number): LatLng | null | undefined {
  return snapper ? snapper(p, maxM) : undefined;
}

type Pt = { x: number; y: number };

/** The closest point to `p` on the polyline segments, in the same (screen) units. */
export function nearestOnLines(p: Pt, lines: Pt[][]): { point: Pt; dist: number } | null {
  let best: { point: Pt; dist: number } | null = null;
  for (const line of lines)
    for (let i = 0; i + 1 < line.length; i++) {
      const a = line[i]!;
      const b = line[i + 1]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len2 = dx * dx + dy * dy;
      const t = len2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2)) : 0;
      const point = { x: a.x + t * dx, y: a.y + t * dy };
      const dist = Math.hypot(point.x - p.x, point.y - p.y);
      if (!best || dist < best.dist) best = { point, dist };
    }
  return best;
}
