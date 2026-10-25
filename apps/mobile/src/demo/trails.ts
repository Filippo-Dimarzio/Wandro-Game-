// Trails in demo mode. Mirrors start_trail / use_trail_hint / answer_trail_clue in
// supabase/migrations/20261105090000_trails.sql and 20261106090000_trail_unlocks.sql so the demo
// plays like the real game.
import {
  CHALLENGE_XP,
  isRightAnswer,
  TRAIL_COMPLETE_COINS,
  TRAIL_HINTS,
  TRAIL_UNLOCK_AFTER,
  TRAIL_UNLOCK_COINS,
  trailBySlug,
  trailStopCoins,
  type TrailError,
} from '@wandro/shared';
import type { LedgerEntry } from './engine';

export interface DemoTrailStop {
  hints: number;
  wrong: number;
  solvedAt?: string;
  coins?: number;
}

export interface DemoTrail {
  startedAt: string;
  completedAt?: string;
  /** By stop position (1-based), like the server. */
  stops: Record<number, DemoTrailStop>;
}

export type DemoTrails = Record<string, DemoTrail>;

export interface ClueResult {
  correct: boolean;
  coins: number;
  completed: boolean;
  bonus: number;
}

/** A trail error with its stable code, like the server's exceptions. */
export class TrailFailure extends Error {
  constructor(public code: TrailError) {
    super(code);
  }
}

const stopOf = (t: DemoTrail, position: number): DemoTrailStop =>
  t.stops[position] ?? { hints: 0, wrong: 0 };

/** Same checks as trail_current_stop(): started, a real stop, earlier stops solved, not solved. */
function currentStop(trails: DemoTrails, slug: string, position: number) {
  const def = trailBySlug(slug);
  if (!def) throw new TrailFailure('unknown_trail');
  const stopDef = def.stops[position - 1];
  if (!stopDef) throw new TrailFailure('unknown_stop');
  const state = trails[slug];
  if (!state) throw new TrailFailure('not_started');
  if (stopOf(state, position).solvedAt) throw new TrailFailure('already_solved');
  for (let p = 1; p < position; p++) {
    if (!stopOf(state, p).solvedAt) throw new TrailFailure('not_current');
  }
  return { def, stopDef, state };
}

/**
 * Unlock (TRAIL_UNLOCK_AFTER discoveries in the city, then TRAIL_UNLOCK_COINS) or resume a trail.
 * Resuming never charges again. Mirrors start_trail() in 20261106090000_trail_unlocks.sql.
 */
export function startTrail(
  trails: DemoTrails,
  slug: string,
  now: Date,
  player: { discoveriesInCity: number; coins: number },
): { trails: DemoTrails; ledger: LedgerEntry[] } {
  if (!trailBySlug(slug)) throw new TrailFailure('unknown_trail');
  if (trails[slug]) return { trails, ledger: [] };
  if (player.discoveriesInCity < TRAIL_UNLOCK_AFTER) throw new TrailFailure('locked');
  if (player.coins < TRAIL_UNLOCK_COINS) throw new TrailFailure('insufficient_coins');
  const at = now.toISOString();
  return {
    trails: { ...trails, [slug]: { startedAt: at, stops: {} } },
    ledger: [{ kind: 'purchase', coins: -TRAIL_UNLOCK_COINS, xp: 0, at, ref: slug }],
  };
}

export function takeTrailHint(
  trails: DemoTrails,
  slug: string,
  position: number,
): { trails: DemoTrails; hint: string } {
  const { stopDef, state } = currentStop(trails, slug, position);
  const stop = stopOf(state, position);
  if (stop.hints >= TRAIL_HINTS) throw new TrailFailure('no_more_hints');
  return {
    hint: stopDef.hints[stop.hints]!,
    trails: {
      ...trails,
      [slug]: {
        ...state,
        stops: { ...state.stops, [position]: { ...stop, hints: stop.hints + 1 } },
      },
    },
  };
}

export function answerTrailClue(
  trails: DemoTrails,
  slug: string,
  position: number,
  answer: string,
  discovered: (placeId: string) => boolean,
  now: Date,
): { trails: DemoTrails; result: ClueResult; ledger: LedgerEntry[] } {
  const { def, stopDef, state } = currentStop(trails, slug, position);
  if (!discovered(stopDef.placeId)) throw new TrailFailure('not_discovered');
  const stop = stopOf(state, position);
  if (!isRightAnswer(stopDef.clue, answer)) {
    return {
      result: { correct: false, coins: 0, completed: false, bonus: 0 },
      ledger: [],
      trails: {
        ...trails,
        [slug]: {
          ...state,
          stops: { ...state.stops, [position]: { ...stop, wrong: stop.wrong + 1 } },
        },
      },
    };
  }
  const at = now.toISOString();
  const coins = trailStopCoins(stop.hints, stop.wrong);
  const last = position === def.stops.length;
  const bonus = last && !state.completedAt ? TRAIL_COMPLETE_COINS : 0;
  const ledger: LedgerEntry[] = [{ kind: 'trail_stop', coins, xp: 0, at, ref: slug }];
  if (bonus) ledger.push({ kind: 'trail', coins: bonus, xp: CHALLENGE_XP, at, ref: slug });
  return {
    result: { correct: true, coins, completed: last, bonus },
    ledger,
    trails: {
      ...trails,
      [slug]: {
        ...state,
        ...(last && { completedAt: state.completedAt ?? at }),
        stops: { ...state.stops, [position]: { ...stop, solvedAt: at, coins } },
      },
    },
  };
}
