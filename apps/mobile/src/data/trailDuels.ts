import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TRAIL_DUEL_ERRORS, trailBySlug, type TrailDuelError } from '@wandro/shared';
import { demoUser } from '@/demo/social';
import { trailDuelError, type TrailDuelStatus } from '@/demo/trailDuels';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

export type { TrailDuelStatus } from '@/demo/trailDuels';

export interface TrailDuelView {
  id: string;
  trailSlug: string;
  trailTitle: string;
  direction: 'incoming' | 'outgoing';
  friendId: string;
  friendUsername: string;
  status: TrailDuelStatus;
  createdAt: string;
  /** Both set once the duel is settled. */
  myScore: number | null;
  friendScore: number | null;
  /** How many stops your friend has solved so far (their score stays hidden until settled). */
  friendSolved: number;
  stops: number;
}

/** Maps an RPC or demo error to its code, for the i18n string duel.error.<code>. */
export function trailDuelErrorCode(e: unknown): TrailDuelError | 'unknown' {
  const msg = e instanceof Error ? e.message : String(e);
  return TRAIL_DUEL_ERRORS.find((k) => msg.includes(k)) ?? 'unknown';
}

type DuelRow = {
  id: string;
  created_at: string;
  status: TrailDuelStatus;
  trail_slug: string;
  trail_title: string;
  direction: 'incoming' | 'outgoing';
  friend_id: string;
  friend_username: string;
  my_score: number | null;
  friend_score: number | null;
  friend_solved: number;
  stops: number;
};

/** Your trail duels, newest first. Duels with someone you've blocked don't show. */
export function useTrailDuels(): TrailDuelView[] {
  const demo = useSession((s) => s.trailDuels);
  const blocked = useSession((s) => s.blocked);
  const server = useQuery({
    queryKey: ['trail-duels'],
    enabled: !isDemo,
    queryFn: async (): Promise<TrailDuelView[]> => {
      const { data, error } = await supabase!.rpc('my_trail_duels');
      if (error) throw error;
      return (data as DuelRow[]).map((d) => ({
        id: d.id,
        trailSlug: d.trail_slug,
        trailTitle: d.trail_title,
        direction: d.direction,
        friendId: d.friend_id,
        friendUsername: d.friend_username,
        status: d.status,
        createdAt: d.created_at,
        myScore: d.my_score,
        friendScore: d.friend_score,
        friendSolved: d.friend_solved,
        stops: d.stops,
      }));
    },
  });
  if (!isDemo) return server.data ?? [];
  return demo
    .filter((d) => !blocked.includes(d.friendId))
    .map((d) => {
      const trail = trailBySlug(d.trail);
      const stops = trail?.stops.length ?? 0;
      return {
        id: d.id,
        trailSlug: d.trail,
        trailTitle: trail?.title ?? '',
        direction: d.direction,
        friendId: d.friendId,
        friendUsername: demoUser(d.friendId)?.username ?? '',
        status: d.status,
        createdAt: d.createdAt,
        myScore: d.status === 'done' ? (d.myScore ?? null) : null,
        friendScore: d.status === 'done' ? d.friendScore : null,
        // Scripted demo friends have already finished.
        friendSolved: stops,
        stops,
      };
    });
}

function useRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['trail-duels'] });
    qc.invalidateQueries({ queryKey: ['wallet'] });
  };
}

export function useChallengeTrailDuel() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ friendId, slug }: { friendId: string; slug: string }) => {
      if (isDemo) {
        const s = useSession.getState();
        const dayAgo = Date.now() - 24 * 3_600_000;
        const err = trailDuelError({
          friendStatus: s.friends[friendId],
          trailExists: !!trailBySlug(slug),
          trailStarted: !!s.trails[slug],
          sentToday: s.trailDuels.filter(
            (d) => d.direction === 'outgoing' && Date.parse(d.createdAt) > dayAgo,
          ).length,
        });
        if (err) throw new Error(err);
        return s.challengeTrailDuel(friendId, slug);
      }
      const { data, error } = await supabase!.rpc('challenge_trail_duel', {
        p_friend: friendId,
        p_trail: slug,
      });
      if (error) throw new Error(error.message);
      return data as string;
    },
    onSuccess: refresh,
  });
}

export function useRespondTrailDuel() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      if (isDemo) return useSession.getState().respondTrailDuel(id, accept);
      const { error } = await supabase!.rpc('respond_trail_duel', {
        p_id: id,
        p_accept: accept,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: refresh,
  });
}
