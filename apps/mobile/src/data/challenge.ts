import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { DAILY_CHALLENGE_BONUS, type Category, type Place } from '@wandro/shared';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  category: Category | null;
  placeId: string | null;
  bonusPoints: number;
  startedAt: string;
  expiresAt: string;
  completedAt: string | null;
  isReady: boolean;
  /** Demo only: discoveries in the window that satisfy the challenge. */
  qualifyingPlaceIds: string[];
}

const ROTATION: { title: string; description: string; category: Category | null }[] = [
  {
    title: 'Find a hidden viewpoint',
    description: 'Discover any nature spot today.',
    category: 'nature',
  },
  {
    title: 'Step into history',
    description: 'Discover any heritage site today.',
    category: 'heritage',
  },
  {
    title: 'Culture hunt',
    description: 'Discover a museum or cultural place today.',
    category: 'culture',
  },
  {
    title: 'Follow the coastline',
    description: 'Discover any beach or coastal spot today.',
    category: 'coast',
  },
  {
    title: 'Wander anywhere new',
    description: 'Discover any place you have never visited.',
    category: null,
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

export function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Pure demo logic so it can be unit-tested; mirrors the server rules. */
export function demoChallenge(
  now: Date,
  state: { date: string; startedAt: string; completedAt?: string } | null,
  unlocked: Record<string, { at: string; points?: number }>,
  places: Place[],
): DailyChallenge {
  const date = todayKey(now);
  const dayIndex = Math.floor(now.getTime() / DAY_MS);
  const def = ROTATION[dayIndex % ROTATION.length];
  const started = state?.date === date ? state.startedAt : now.toISOString();
  const expires = new Date(new Date(started).getTime() + DAY_MS).toISOString();
  const qualifying = Object.entries(unlocked).filter(([id, u]) => {
    if (u.at < started || u.at > expires) return false;
    const p = places.find((x) => x.id === id);
    return !!p && (def.category === null || p.category === def.category);
  });
  const isReady = qualifying.length > 0;
  // Double coins: the bonus repeats the best qualifying discovery's coins.
  const bonus = Math.max(DAILY_CHALLENGE_BONUS, ...qualifying.map(([, u]) => u.points ?? 0));
  return {
    id: `demo-${date}`,
    ...def,
    placeId: null,
    bonusPoints: bonus,
    startedAt: started,
    expiresAt: expires,
    completedAt: state?.date === date ? (state.completedAt ?? null) : null,
    isReady,
    qualifyingPlaceIds: qualifying.map(([id]) => id),
  };
}

interface ServerChallengeRow {
  challenge_id: string;
  title: string;
  description: string;
  place_id: string | null;
  category: Category | null;
  bonus_points: number;
  started_at: string;
  expires_at: string;
  completed_at: string | null;
  is_ready: boolean;
}

export function useDailyChallenge(places: Place[]) {
  const qc = useQueryClient();
  const unlocked = useSession((s) => s.unlocked);
  const demoState = useSession((s) => s.challenge);
  const setChallenge = useSession((s) => s.setChallenge);
  const completeChallenge = useSession((s) => s.completeChallenge);

  // Demo: computed on-device. Opening it starts the user's rolling 24 h window.
  const demo = useMemo(
    () => (isDemo ? demoChallenge(new Date(), demoState, unlocked, places) : null),
    [demoState, unlocked, places],
  );
  useEffect(() => {
    if (demo && demoState?.date !== todayKey())
      setChallenge({ date: todayKey(), startedAt: demo.startedAt });
  }, [demo, demoState, setChallenge]);

  const server = useQuery({
    queryKey: ['daily-challenge'],
    enabled: !isDemo,
    queryFn: async (): Promise<DailyChallenge | null> => {
      const { data, error } = await supabase!.rpc('open_daily_challenge');
      if (error) throw error;
      const row = (data as ServerChallengeRow[])[0];
      if (!row) return null;
      return {
        id: row.challenge_id,
        title: row.title,
        description: row.description,
        category: row.category,
        placeId: row.place_id,
        bonusPoints: row.bonus_points,
        startedAt: row.started_at,
        expiresAt: row.expires_at,
        completedAt: row.completed_at,
        isReady: row.is_ready,
        qualifyingPlaceIds: [],
      };
    },
  });

  const confirm = useMutation({
    mutationFn: async (c: DailyChallenge) => {
      if (isDemo) {
        if (!c.isReady || c.completedAt) throw new Error('challenge_not_satisfied');
        if (new Date() > new Date(c.expiresAt)) throw new Error('challenge_expired');
        setChallenge({
          date: todayKey(),
          startedAt: c.startedAt,
          completedAt: new Date().toISOString(),
        });
        const bonus = completeChallenge(c.qualifyingPlaceIds, c.id, places);
        return { status: 'completed', bonus_points: bonus };
      }
      // The server re-validates everything; the tap only claims the bonus.
      const { data, error } = await supabase!.rpc('complete_daily_challenge', {
        p_challenge_id: c.id,
      });
      if (error) throw error;
      return data as { status: string; bonus_points: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-challenge'] });
      qc.invalidateQueries({ queryKey: ['my-visits'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });

  return {
    challenge: isDemo ? demo : (server.data ?? null),
    isLoading: !isDemo && server.isLoading,
    error: isDemo ? null : server.error,
    confirm,
  };
}
