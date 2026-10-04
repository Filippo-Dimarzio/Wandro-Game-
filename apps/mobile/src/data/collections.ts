import { useQuery } from '@tanstack/react-query';
import { DEMO_PLACES, type Category } from '@wandro/shared';
import { DEMO_COLLECTIONS } from '@/demo/collections';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

export interface SetPlace {
  id: string;
  name: string;
  category: Category;
  found: boolean;
}

export interface CollectionProgress {
  id: string;
  title: string;
  description: string;
  /** Cover art and colour come from this category. */
  theme: Category;
  /** Launch city slug; sets are grouped by city. */
  region: string | null;
  coverUrl?: string;
  /** Coins for finishing the set. */
  bonus: number;
  /** Coins for each place of the set you find. */
  stepBonus: number;
  places: SetPlace[];
  done: number;
  total: number;
  completed: boolean;
}

/** A set takes the colour of the category most of its places share. */
function dominantCategory(places: { category: Category }[]): Category {
  const counts = new Map<Category, number>();
  for (const p of places) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'other';
}

export function useCollections(): CollectionProgress[] {
  const unlocked = useSession((s) => s.unlocked);
  const claimed = useSession((s) => s.collectionsClaimed);
  const server = useQuery({
    queryKey: ['collections'],
    enabled: !isDemo,
    queryFn: async (): Promise<CollectionProgress[]> => {
      const { data, error } = await supabase!.rpc('my_collections');
      if (error) throw error;
      return (
        data as {
          id: string;
          title: string;
          description: string;
          cover_url: string | null;
          completion_bonus: number;
          step_bonus: number;
          region_slug: string | null;
          total: number;
          done: number;
          completed: boolean;
          places: SetPlace[];
        }[]
      ).map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        theme: dominantCategory(c.places),
        region: c.region_slug,
        coverUrl: c.cover_url ?? undefined,
        bonus: c.completion_bonus,
        stepBonus: c.step_bonus,
        places: c.places,
        done: Number(c.done),
        total: Number(c.total),
        completed: c.completed,
      }));
    },
  });
  if (!isDemo) return server.data ?? [];
  return DEMO_COLLECTIONS.map((c) => {
    const places = c.placeIds.flatMap((id) => {
      const p = DEMO_PLACES.find((x) => x.id === id);
      return p ? [{ id, name: p.name, category: p.category, found: !!unlocked[id] }] : [];
    });
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      theme: c.theme,
      region: c.region,
      bonus: c.bonus,
      stepBonus: c.stepBonus,
      places,
      done: places.filter((p) => p.found).length,
      total: places.length,
      completed: !!claimed[c.id],
    };
  });
}
