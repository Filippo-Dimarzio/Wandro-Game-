import {
  DEMO_PLACES,
  GEMS_UNLOCK_AFTER,
  gemsLeftToUnlock,
  REGIONS,
  type Region,
} from '@wandro/shared';
import { useCollections, type CollectionProgress } from '@/data/collections';
import { useUnlockedIds } from '@/data/places';
import { isDemo } from '@/lib/env';

export interface City {
  region: Region;
  sets: CollectionProgress[];
  done: number;
  total: number;
  /** You've discovered a place here: the landmark shows in colour and you hold its stamp. */
  unlocked: boolean;
  /** Discoveries still needed here before its hidden gems appear. */
  gemsLeft: number;
}

/** Your progress in every launch city, in REGIONS order. */
export function useCities(): City[] {
  const collections = useCollections();
  const { ids } = useUnlockedIds();
  return REGIONS.map((region) => {
    const sets = collections.filter((s) => s.region === region.slug);
    const done = sets.reduce((a, s) => a + s.done, 0);
    // Demo knows every place's city; with a backend, set progress stands in for it.
    const discoveredHere = isDemo
      ? DEMO_PLACES.filter((p) => p.region === region.slug && ids.has(p.id)).length
      : done;
    return {
      region,
      sets,
      done,
      total: sets.reduce((a, s) => a + s.total, 0),
      unlocked: discoveredHere > 0,
      gemsLeft: isDemo
        ? gemsLeftToUnlock(DEMO_PLACES, ids, region.slug)
        : Math.max(0, GEMS_UNLOCK_AFTER - done),
    };
  });
}
