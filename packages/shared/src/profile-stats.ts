import { CATEGORIES } from './constants';
import type { Category, Place } from './types';

/** A player's exploring record for the profile page (demo mode mirrors my_explorer_stats()). */
export interface ExplorerStats {
  total: number;
  byCategory: Record<Category, number>;
  /** Discovered and total active places per city, in REGIONS order. */
  cities: { region: string; found: number; total: number }[];
  firstDiscoveries: number;
  /** The discovered place with the fewest explorers. */
  rarest: { name: string; visitors: number } | null;
}

export function emptyByCategory(): Record<Category, number> {
  return Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
}

export function explorerStats(
  found: Place[],
  all: Place[],
  firstDiscoveries: number,
  regions: readonly string[],
): ExplorerStats {
  const byCategory = emptyByCategory();
  for (const p of found) byCategory[p.category] += 1;
  const rarestPlace = found.reduce<Place | null>(
    (best, p) => (!best || p.uniqueVisitors < best.uniqueVisitors ? p : best),
    null,
  );
  return {
    total: found.length,
    byCategory,
    cities: regions.map((region) => ({
      region,
      found: found.filter((p) => p.region === region).length,
      total: all.filter((p) => p.region === region).length,
    })),
    firstDiscoveries,
    rarest: rarestPlace ? { name: rarestPlace.name, visitors: rarestPlace.uniqueVisitors } : null,
  };
}

/** The category a player discovers most: their explorer class. Ties go to CATEGORIES order. */
export function explorerClass(byCategory: Record<Category, number>): Category | null {
  let best: Category | null = null;
  for (const c of CATEGORIES)
    if (byCategory[c] > 0 && (!best || byCategory[c] > byCategory[best])) best = c;
  return best;
}

export type BadgeTier = 'bronze' | 'silver' | 'gold';

/** How hard each badge is, for the trophy shelf. Every badge in BADGES has a tier (tested). */
export const BADGE_TIER: Record<string, BadgeTier> = {
  first_step: 'bronze',
  heritage_3: 'bronze',
  challenger: 'bronze',
  explorer_10: 'silver',
  nature_5: 'silver',
  culture_5: 'silver',
  castle_keeper: 'silver',
  hidden_gem: 'silver',
  challenger_7: 'silver',
  first_discoverer: 'gold',
  sintra_complete: 'gold',
  streak_7: 'gold',
};
