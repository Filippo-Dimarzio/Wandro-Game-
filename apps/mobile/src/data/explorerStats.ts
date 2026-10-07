import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  DEMO_PLACES,
  emptyByCategory,
  explorerStats,
  REGIONS,
  type Category,
  type ExplorerStats,
} from '@wandro/shared';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

const REGION_SLUGS = REGIONS.map((r) => r.slug);

interface StatsRow {
  total: number;
  by_category: Partial<Record<Category, number>>;
  cities: { region: string; found: number; total: number }[];
  first_discoveries: number;
  rarest: { name: string; visitors: number } | null;
}

/** Turns my_explorer_stats() into ExplorerStats, with cities in REGIONS order. */
export function rowToStats(r: StatsRow): ExplorerStats {
  return {
    total: r.total,
    byCategory: { ...emptyByCategory(), ...r.by_category },
    cities: REGION_SLUGS.map(
      (region) => r.cities.find((c) => c.region === region) ?? { region, found: 0, total: 0 },
    ),
    firstDiscoveries: r.first_discoveries,
    rarest: r.rarest,
  };
}

/** The player's exploring record for the profile. Read-only; the server owns the numbers. */
export function useExplorerStats(): ExplorerStats {
  const unlocked = useSession((s) => s.unlocked);
  const demo = useMemo(() => {
    const found = DEMO_PLACES.filter((p) => unlocked[p.id]);
    const firsts = Object.values(unlocked).filter((u) => u.firstDiscoverer).length;
    return explorerStats(found, DEMO_PLACES, firsts, REGION_SLUGS);
  }, [unlocked]);
  const server = useQuery({
    queryKey: ['explorer-stats'],
    enabled: !isDemo,
    queryFn: async () => {
      const { data, error } = await supabase!.rpc('my_explorer_stats');
      if (error) throw error;
      return rowToStats(data as StatsRow);
    },
  });
  if (isDemo) return demo;
  return server.data ?? explorerStats([], [], 0, REGION_SLUGS);
}
