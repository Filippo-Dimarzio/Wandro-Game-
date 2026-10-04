import {
  DEMO_PLACES,
  GEMS_UNLOCK_AFTER,
  gemsLeftToUnlock,
  REGIONS,
  type Region,
} from '@wandro/shared';
import { useQuery } from '@tanstack/react-query';
import { useCollections, type CollectionProgress } from '@/data/collections';
import { useUnlockedIds } from '@/data/places';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

export interface City {
  region: Region;
  sets: CollectionProgress[];
  done: number;
  total: number;
  /** You've discovered a place here: the landmark shows in colour and you hold its stamp. */
  unlocked: boolean;
  /** Discoveries still needed here before its hidden gems appear. */
  gemsLeft: number;
  /** The stamp was collected with gold stamp ink. */
  gold: boolean;
}

/** Your city stamps by region: true for gold ones (server: city_stamps). */
export function useCityStamps(): Record<string, boolean> {
  const demo = useSession((s) => s.stamps);
  const server = useQuery({
    queryKey: ['city-stamps'],
    enabled: !isDemo,
    queryFn: async () => {
      const { data, error } = await supabase!.from('city_stamps').select('region_slug, gold');
      if (error) throw error;
      return Object.fromEntries(data.map((r) => [r.region_slug as string, !!r.gold]));
    },
  });
  if (!isDemo) return server.data ?? {};
  return Object.fromEntries(Object.entries(demo).map(([k, v]) => [k, v.gold]));
}

/** Your progress in every launch city, in REGIONS order. */
export function useCities(): City[] {
  const collections = useCollections();
  const { ids } = useUnlockedIds();
  const stamps = useCityStamps();
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
      gold: !!stamps[region.slug],
    };
  });
}
