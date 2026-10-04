import { useQuery } from '@tanstack/react-query';
import { timeQuestFor, type TimeQuest } from '@wandro/shared';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';

/** The place's golden-hour or night quest, if it has one (server: time_quests()). */
export function useTimeQuest(placeId: string): TimeQuest | undefined {
  const server = useQuery({
    queryKey: ['time-quests'],
    enabled: !isDemo,
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase!.rpc('time_quests');
      if (error) throw error;
      return Object.fromEntries(
        (data as { place_id: string; kind: TimeQuest }[]).map((r) => [r.place_id, r.kind]),
      ) as Record<string, TimeQuest>;
    },
  });
  return isDemo ? timeQuestFor(placeId) : server.data?.[placeId];
}
