import { useQuery } from '@tanstack/react-query';
import type { Place } from '@wandro/shared';
import { DEMO_COLLECTIONS } from '@/demo/collections';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

export interface CollectionProgress {
  id: string;
  title: string;
  description: string;
  colors: [string, string];
  coverUrl?: string;
  bonus: number;
  placeIds: string[];
  done: number;
  total: number;
  completed: boolean;
}

const PALETTE: [string, string][] = [
  ['#B7791F', '#3C2A0A'],
  ['#2B6CB0', '#0A2540'],
  ['#2F855A', '#0B2A24'],
  ['#6B46C1', '#241046'],
];

export function useCollections(places: Place[]) {
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
          total: number;
          done: number;
          completed: boolean;
          place_ids: string[];
        }[]
      ).map((c, i) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        colors: PALETTE[i % PALETTE.length],
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
      colors: c.colors,
      bonus: c.bonus,
      placeIds: ids,
      done: ids.filter((id) => unlocked[id]).length,
      total: ids.length,
      completed: !!claimed[c.id],
    };
  });
}
