import { useQuery } from '@tanstack/react-query';
import type { Category, Place } from '@wandro/shared';
import { DEMO_COLLECTIONS } from '@/demo/collections';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

export interface CollectionProgress {
  id: string;
  title: string;
  description: string;
  /** Cover art and colour come from this category. */
  theme: Category;
  coverUrl?: string;
  bonus: number;
  placeIds: string[];
  done: number;
  total: number;
  completed: boolean;
}

/** A collection takes the colour of the category most of its places share. */
function dominantCategory(placeIds: string[], places: Place[]): Category {
  const counts = new Map<Category, number>();
  for (const id of placeIds) {
    const cat = places.find((p) => p.id === id)?.category;
    if (cat) counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'other';
}

export function useCollections(places: Place[]) {
  const unlocked = useSession((s) => s.unlocked);
  const claimed = useSession((s) => s.collectionsClaimed);
  const server = useQuery({
    queryKey: ['collections', places.length],
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
          total: number;
          done: number;
          completed: boolean;
          place_ids: string[];
        }[]
      ).map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        theme: dominantCategory(c.place_ids, places),
        coverUrl: c.cover_url ?? undefined,
        bonus: c.completion_bonus,
        placeIds: c.place_ids,
        done: Number(c.done),
        total: Number(c.total),
        completed: c.completed,
      }));
    },
  });
  if (!isDemo) return server.data ?? [];
  return DEMO_COLLECTIONS.map((c) => {
    const ids = c.placeIds.filter((id) => places.some((p) => p.id === id));
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      theme: c.theme,
      bonus: c.bonus,
      placeIds: ids,
      done: ids.filter((id) => unlocked[id]).length,
      total: ids.length,
      completed: !!claimed[c.id],
    };
  });
}
