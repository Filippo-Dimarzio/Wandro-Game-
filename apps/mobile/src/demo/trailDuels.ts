// Trail duels in demo mode. Mirrors supabase/migrations/20261108090000_trail_duels.sql: friends
// only, on a trail you've unlocked, one open duel per friend and trail, settled once both have
// finished (trailDuelReward). Demo friends are scripted: they accept at once and have already
// finished every trail with FRIEND_SCORE_OFF fewer coins than a perfect run.
import {
  TRAIL_DUELS_PER_DAY,
  TRAIL_STOP_COINS,
  trailBySlug,
  trailDuelReward,
  type TrailDuelError,
} from '@wandro/shared';
import type { LedgerEntry } from './engine';
import type { FriendStatus } from './friends';

export type TrailDuelStatus = 'pending' | 'accepted' | 'declined' | 'done';

export interface DemoTrailDuel {
  id: string;
  trail: string;
  friendId: string;
  direction: 'incoming' | 'outgoing';
  status: TrailDuelStatus;
  createdAt: string;
  /** The scripted friend's finished score. */
  friendScore: number;
  /** Your score once the duel is settled. */
  myScore?: number;
}

/** Demo friends lose this many coins to hints and wrong answers on every trail. */
const FRIEND_SCORE_OFF = 15;

export const friendScoreFor = (slug: string): number =>
  (trailBySlug(slug)?.stops.length ?? 0) * TRAIL_STOP_COINS - FRIEND_SCORE_OFF;

export function initialTrailDuels(now = new Date()): DemoTrailDuel[] {
  return [
    {
      id: 'demo-duel-1',
      trail: 'sintra-artist-king',
      friendId: 'demo-user-mia',
      direction: 'incoming',
      status: 'pending',
      createdAt: new Date(now.getTime() - 5 * 3_600_000).toISOString(),
      friendScore: friendScoreFor('sintra-artist-king'),
    },
  ];
}

const isOpen = (d: DemoTrailDuel) => d.status === 'pending' || d.status === 'accepted';

/** Same checks as challenge_trail_duel(); null when it may be sent. */
export function trailDuelError(input: {
  friendStatus: FriendStatus | undefined;
  trailStarted: boolean;
  trailExists: boolean;
  sentToday: number;
}): TrailDuelError | null {
  if (input.friendStatus !== 'friends') return 'not_friends';
  if (!input.trailExists) return 'unknown_trail';
  if (!input.trailStarted) return 'not_started';
  if (input.sentToday >= TRAIL_DUELS_PER_DAY) return 'rate_limited';
  return null;
}

/** Sends a duel (or returns the open one); scripted friends accept straight away. */
export function sendTrailDuel(
  duels: DemoTrailDuel[],
  friendId: string,
  slug: string,
  now: Date,
): { duels: DemoTrailDuel[]; id: string } {
  const open = duels.find((d) => d.trail === slug && d.friendId === friendId && isOpen(d));
  if (open) return { duels, id: open.id };
  const id = `demo-duel-${now.getTime()}-${friendId}`;
  return {
    id,
    duels: [
      {
        id,
        trail: slug,
        friendId,
        direction: 'outgoing',
        status: 'accepted',
        createdAt: now.toISOString(),
        friendScore: friendScoreFor(slug),
      },
      ...duels,
    ],
  };
}

/** Settles accepted duels on a trail once you've finished it (your score), like the server. */
export function settleTrailDuels(
  duels: DemoTrailDuel[],
  slug: string,
  myScore: number | null,
  now: Date,
): { duels: DemoTrailDuel[]; ledger: LedgerEntry[] } {
  if (myScore === null) return { duels, ledger: [] };
  const ledger: LedgerEntry[] = [];
  const next = duels.map((d) => {
    if (d.trail !== slug || d.status !== 'accepted') return d;
    ledger.push({
      kind: 'trail_duel',
      coins: trailDuelReward(myScore, d.friendScore),
      xp: 0,
      at: now.toISOString(),
      ref: d.id,
    });
    return { ...d, status: 'done' as const, myScore };
  });
  return { duels: next, ledger };
}
