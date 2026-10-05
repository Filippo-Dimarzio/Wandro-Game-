import { useMutation, useQuery } from '@tanstack/react-query';
import { explorerFor, isExplorerId, type ExplorerId } from '@wandro/shared';
import { useAuthSession } from '@/lib/auth';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

/** The explorer the signed-in player walks the map as. */
export function useMyExplorer(): ExplorerId {
  const profile = useSession((s) => s.profile);
  const { session } = useAuthSession();
  return explorerFor(session?.user.id ?? profile?.username ?? 'me', profile?.explorer);
}

/** Choose your explorer: saved on this device and, with a backend, on your profile. */
export function useSetExplorer() {
  const updateProfile = useSession((s) => s.updateProfile);
  const { session } = useAuthSession();
  return useMutation({
    mutationFn: async (explorer: ExplorerId) => {
      if (!isDemo && supabase && session) {
        const { error } = await supabase
          .from('profiles')
          .update({ explorer })
          .eq('id', session.user.id);
        if (error) throw error;
      }
      updateProfile({ explorer });
    },
  });
}

/**
 * Other players' explorers, by user id. Profiles are readable by signed-in players; anyone who
 * hasn't chosen yet (and every demo player) gets a steady explorer picked from their id.
 */
export function useExplorers(userIds: string[]): Record<string, ExplorerId> {
  const ids = [...new Set(userIds)].sort();
  const server = useQuery({
    queryKey: ['explorers', ids],
    enabled: !isDemo && ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase!.from('profiles').select('id, explorer').in('id', ids);
      if (error) throw error;
      return data as { id: string; explorer: string | null }[];
    },
  });
  const chosen = new Map((server.data ?? []).map((r) => [r.id, r.explorer]));
  return Object.fromEntries(
    ids.map((id) => {
      const c = chosen.get(id);
      return [id, explorerFor(id, isExplorerId(c) ? c : null)];
    }),
  );
}
