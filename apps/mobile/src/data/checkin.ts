import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { evaluateCheckin, type Ping, type Place } from '@wandro/shared';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { UserLocation } from '@/lib/useLocation';
import { useSession } from '@/state/session';

export interface CheckinOutcome {
  status: 'verified' | 'rejected' | 'flagged';
  coins?: number;
  firstDiscovererBonus?: number;
  level?: number;
  streak?: number;
  newBadges?: string[];
  collectionsCompleted?: string[];
  /** Coins from sets (already included in `coins`). */
  setCoins?: number;
  /** Time-of-day key and friend beacon bonuses (already included in `coins`). */
  timeQuestBonus?: number;
  beaconBonus?: number;
  /** A city stamp this discovery collected. */
  stamp?: { region: string; gold: boolean };
  reason?: string;
}

export type CheckinPhase =
  | { kind: 'idle' }
  | { kind: 'starting' }
  | { kind: 'completing' }
  | { kind: 'done'; place: Place; outcome: CheckinOutcome }
  | { kind: 'error'; code: string };

/** Maps server error messages (raised in SQL) to stable codes for i18n. */
export function errorCode(e: unknown): string {
  const msg = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e);
  const known = [
    'too_far',
    'low_accuracy',
    'already_discovered',
    'rate_limited',
    'place_not_active',
    'session_not_open',
  ];
  return known.find((k) => msg.includes(k)) ?? 'unknown';
}

/**
 * Discovery flow, instant: no waiting at the place. Demo: validated on-device with the same rules
 * as the server (shared evaluateCheckin). Backend: start_checkin (checks you're inside the
 * geofence) -> complete_checkin straight away.
 */
export function useCheckin(location: UserLocation, places: Place[]) {
  const qc = useQueryClient();
  const recordVisit = useSession((s) => s.recordVisit);
  const [phase, setPhase] = useState<CheckinPhase>({ kind: 'idle' });
  const locRef = useRef(location);
  locRef.current = location;

  const finish = useCallback(
    (place: Place, outcome: CheckinOutcome) => {
      setPhase({ kind: 'done', place, outcome });
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['my-visits'] });
      qc.invalidateQueries({ queryKey: ['places'] });
      qc.invalidateQueries({ queryKey: ['daily-challenge'] });
      qc.invalidateQueries({ queryKey: ['collections'] });
      qc.invalidateQueries({ queryKey: ['shareable'] });
      qc.invalidateQueries({ queryKey: ['city-stamps'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['friend-challenges'] });
    },
    [qc],
  );

  const sample = (): Ping => ({
    lat: locRef.current.position.lat,
    lng: locRef.current.position.lng,
    accuracyM: locRef.current.accuracy ?? 999,
    isMocked: locRef.current.isMocked,
    at: Date.now(),
  });

  const startDemo = (place: Place) => {
    const verdict = evaluateCheckin([sample()], {
      lat: place.lat,
      lng: place.lng,
      radiusM: place.geofenceRadiusM,
    });
    if (verdict.status !== 'verified') {
      finish(place, { status: verdict.status, reason: verdict.reason });
      return;
    }
    const r = recordVisit(place, places);
    finish(
      place,
      r ? { status: 'verified', ...r } : { status: 'rejected', reason: 'already_discovered' },
    );
  };

  const startServer = async (place: Place) => {
    const db = supabase!;
    const here = sample();
    const { data, error } = await db.rpc('start_checkin', {
      p_place_id: place.id,
      p_lat: here.lat,
      p_lng: here.lng,
      p_accuracy: here.accuracyM,
      p_is_mocked: here.isMocked,
    });
    if (error) throw error;
    const { session_id: sessionId } = data as { session_id: string };
    setPhase({ kind: 'completing' });
    const res = await db.rpc('complete_checkin', { p_session_id: sessionId });
    if (res.error) throw res.error;
    const r = res.data as {
      status: string;
      coins?: number;
      level?: number;
      streak?: number;
      new_badges?: string[];
      reason?: string;
      breakdown?: {
        first_discoverer?: number;
        sets?: number;
        time_quest?: number;
        beacon?: number;
      };
      stamp?: { region: string; gold: boolean } | null;
    };
    finish(place, {
      status: r.status as CheckinOutcome['status'],
      coins: r.coins,
      level: r.level,
      streak: r.streak,
      newBadges: r.new_badges ?? [],
      firstDiscovererBonus: r.breakdown?.first_discoverer,
      setCoins: r.breakdown?.sets,
      timeQuestBonus: r.breakdown?.time_quest,
      beaconBonus: r.breakdown?.beacon,
      stamp: r.stamp ?? undefined,
      reason: r.reason,
    });
  };

  const start = useCallback(
    (place: Place) => {
      setPhase({ kind: 'starting' });
      if (isDemo) {
        startDemo(place);
        return;
      }
      startServer(place).catch((e) => {
        setPhase({ kind: 'error', code: errorCode(e) });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [places],
  );

  const reset = useCallback(() => setPhase({ kind: 'idle' }), []);

  return { phase, start, reset };
}
