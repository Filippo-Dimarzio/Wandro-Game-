import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { evaluateCheckin, PING_INTERVAL_SECONDS, type Ping, type Place } from '@wandro/shared';
import { DEMO_DWELL_SECONDS, isDemo } from '@/lib/env';
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
  reason?: string;
}

export type CheckinPhase =
  | { kind: 'idle' }
  | { kind: 'starting' }
  | { kind: 'dwelling'; secondsLeft: number; totalSeconds: number }
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
 * Discovery flow. Demo: validated on-device with the same rules as the server (shared
 * evaluateCheckin). Backend: start_checkin -> a ping every 5 s -> complete_checkin.
 */
export function useCheckin(location: UserLocation, places: Place[]) {
  const qc = useQueryClient();
  const recordVisit = useSession((s) => s.recordVisit);
  const [phase, setPhase] = useState<CheckinPhase>({ kind: 'idle' });
  const locRef = useRef(location);
  locRef.current = location;
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);

  const clear = () => {
    timers.current.forEach(clearInterval);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const finish = useCallback(
    (place: Place, outcome: CheckinOutcome) => {
      clear();
      setPhase({ kind: 'done', place, outcome });
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['my-visits'] });
      qc.invalidateQueries({ queryKey: ['places'] });
      qc.invalidateQueries({ queryKey: ['daily-challenge'] });
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
    const startedAt = Date.now();
    const pings: Ping[] = [sample()];
    const target = {
      lat: place.lat,
      lng: place.lng,
      radiusM: place.geofenceRadiusM,
      dwellSeconds: DEMO_DWELL_SECONDS,
    };
    setPhase({
      kind: 'dwelling',
      secondsLeft: DEMO_DWELL_SECONDS,
      totalSeconds: DEMO_DWELL_SECONDS,
    });
    timers.current.push(
      setInterval(() => {
        pings.push(sample());
        const verdict = evaluateCheckin(pings, target, startedAt, Date.now());
        if (verdict.status === 'pending') {
          setPhase({
            kind: 'dwelling',
            secondsLeft: verdict.secondsLeft,
            totalSeconds: DEMO_DWELL_SECONDS,
          });
          return;
        }
        if (verdict.status !== 'verified') {
          finish(place, { status: verdict.status, reason: verdict.reason });
          return;
        }
        const r = recordVisit(place, places);
        finish(
          place,
          r ? { status: 'verified', ...r } : { status: 'rejected', reason: 'already_discovered' },
        );
      }, 1000),
    );
  };

  const startServer = async (place: Place) => {
    const db = supabase!;
    const first = sample();
    const { data, error } = await db.rpc('start_checkin', {
      p_place_id: place.id,
      p_lat: first.lat,
      p_lng: first.lng,
      p_accuracy: first.accuracyM,
      p_is_mocked: first.isMocked,
    });
    if (error) throw error;
    const { session_id: sessionId, dwell_seconds: dwell } = data as {
      session_id: string;
      dwell_seconds: number;
    };
    const startedAt = Date.now();
    setPhase({ kind: 'dwelling', secondsLeft: dwell, totalSeconds: dwell });

    timers.current.push(
      setInterval(() => {
        const p = sample();
        db.rpc('add_checkin_ping', {
          p_session_id: sessionId,
          p_lat: p.lat,
          p_lng: p.lng,
          p_accuracy: p.accuracyM,
          p_is_mocked: p.isMocked,
        }).then(() => undefined);
      }, PING_INTERVAL_SECONDS * 1000),
    );

    const tryComplete = async (): Promise<void> => {
      setPhase({ kind: 'completing' });
      const res = await db.rpc('complete_checkin', { p_session_id: sessionId });
      if (res.error) throw res.error;
      const r = res.data as {
        status: string;
        seconds_left?: number;
        coins?: number;
        level?: number;
        streak?: number;
        new_badges?: string[];
        reason?: string;
        breakdown?: { first_discoverer?: number };
      };
      if (r.status === 'pending') {
        setTimeout(
          () => tryComplete().catch((e) => setPhase({ kind: 'error', code: errorCode(e) })),
          (r.seconds_left ?? 1) * 1000 + 500,
        );
        return;
      }
      finish(place, {
        status: r.status as CheckinOutcome['status'],
        coins: r.coins,
        level: r.level,
        streak: r.streak,
        newBadges: r.new_badges ?? [],
        firstDiscovererBonus: r.breakdown?.first_discoverer,
        reason: r.reason,
      });
    };

    timers.current.push(
      setInterval(() => {
        const left = Math.max(0, dwell - Math.floor((Date.now() - startedAt) / 1000));
        if (left > 0) {
          setPhase({ kind: 'dwelling', secondsLeft: left, totalSeconds: dwell });
          return;
        }
        clearInterval(timers.current.pop());
        tryComplete().catch((e) => setPhase({ kind: 'error', code: errorCode(e) }));
      }, 1000),
    );
  };

  const start = useCallback(
    (place: Place) => {
      clear();
      setPhase({ kind: 'starting' });
      if (isDemo) {
        startDemo(place);
        return;
      }
      startServer(place).catch((e) => {
        clear();
        setPhase({ kind: 'error', code: errorCode(e) });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [places],
  );

  const reset = useCallback(() => {
    clear();
    setPhase({ kind: 'idle' });
  }, []);

  return { phase, start, reset };
}
