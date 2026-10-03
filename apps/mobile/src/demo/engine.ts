// On-device game engine for demo mode. It mirrors the server rules in supabase/migrations so the
// demo plays exactly like the real game; with a backend none of this runs.
import {
  DAILY_CHALLENGE_BONUS,
  FIRST_DISCOVERER_BONUS,
  levelFromXp,
  newlyEarnedBadges,
  nextStreak,
  pointsForVisit,
  streakXp,
  type Category,
  type Place,
} from '@wandro/shared';
import { DEMO_COLLECTIONS } from './collections';

export type LedgerKind =
  'visit' | 'first_discoverer' | 'daily_challenge' | 'streak' | 'badge' | 'collection' | 'purchase';

export interface LedgerEntry {
  kind: LedgerKind;
  coins: number;
  xp: number;
  at: string;
  ref?: string;
}

export interface DemoUnlock {
  at: string;
  /** Coins earned for the visit itself (excluding bonuses). */
  points: number;
  visitorsBefore: number;
  firstDiscoverer: boolean;
}

export interface DemoProgress {
  unlocked: Record<string, DemoUnlock>;
  ledger: LedgerEntry[];
  streak: number;
  lastActiveDate: string | null;
  badges: Record<string, string>;
  challengesCompleted: number;
  collectionsClaimed: Record<string, string>;
}

export const EMPTY_PROGRESS: DemoProgress = {
  unlocked: {},
  ledger: [],
  streak: 0,
  lastActiveDate: null,
  badges: {},
  challengesCompleted: 0,
  collectionsClaimed: {},
};

export interface VisitResult {
  coins: number;
  firstDiscovererBonus: number;
  multiplier: number;
  streak: number;
  level: number;
  newBadges: string[];
  collectionsCompleted: string[];
}

/** Calendar day in Lisbon (YYYY-MM-DD), matching the server's lisbon_today(). */
export function lisbonDate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(d);
}

export function walletOf(p: DemoProgress) {
  const coins = p.ledger.reduce((s, e) => s + e.coins, 0);
  const coinsEarned = p.ledger.reduce((s, e) => s + Math.max(0, e.coins), 0);
  const xp = p.ledger.reduce((s, e) => s + e.xp, 0);
  return {
    coins,
    coinsEarned,
    xp,
    level: levelFromXp(xp),
    streak: p.streak,
    discoveries: Object.keys(p.unlocked).length,
  };
}

function regionOf(_place: Place): string {
  return 'sintra';
}

function applyBadgesAndCollections(p: DemoProgress, places: Place[], now: Date) {
  const at = now.toISOString();
  const ledger = [...p.ledger];
  const collectionsClaimed = { ...p.collectionsClaimed };
  const collectionsCompleted: string[] = [];
  for (const c of DEMO_COLLECTIONS) {
    if (collectionsClaimed[c.id]) continue;
    if (c.placeIds.every((id) => p.unlocked[id])) {
      collectionsClaimed[c.id] = at;
      collectionsCompleted.push(c.id);
      ledger.push({ kind: 'collection', coins: c.bonus, xp: c.bonus, at, ref: c.id });
    }
  }

  const visits = Object.entries(p.unlocked).map(([id, u]) => {
    const place = places.find((x) => x.id === id);
    return {
      category: (place?.category ?? 'other') as Category,
      visitorsBefore: u.visitorsBefore,
      firstDiscoverer: u.firstDiscoverer,
      region: place ? regionOf(place) : undefined,
    };
  });
  const earned = newlyEarnedBadges(
    {
      visits,
      regionPlaceCounts: { sintra: places.length },
      streak: p.streak,
      dailyChallenges: p.challengesCompleted,
    },
    new Set(Object.keys(p.badges)),
  );
  const badges = { ...p.badges };
  for (const b of earned) {
    badges[b.code] = at;
    ledger.push({ kind: 'badge', coins: 0, xp: b.xp, at, ref: b.code });
  }
  return {
    progress: { ...p, ledger, badges, collectionsClaimed },
    newBadges: earned.map((b) => b.code),
    collectionsCompleted,
  };
}

export function applyVisit(
  p: DemoProgress,
  place: Place,
  places: Place[],
  now: Date,
): { progress: DemoProgress; result: VisitResult } | null {
  if (p.unlocked[place.id]) return null;
  const at = now.toISOString();
  const n = place.uniqueVisitors;
  const pts = pointsForVisit(place.category, n, place.basePoints);
  const visitCoins = pts.total - pts.firstDiscovererBonus;
  const ledger: LedgerEntry[] = [
    ...p.ledger,
    { kind: 'visit', coins: visitCoins, xp: visitCoins, at, ref: place.id },
  ];
  if (pts.firstDiscovererBonus) {
    ledger.push({
      kind: 'first_discoverer',
      coins: FIRST_DISCOVERER_BONUS,
      xp: FIRST_DISCOVERER_BONUS,
      at,
      ref: place.id,
    });
  }
  const today = lisbonDate(now);
  const streak = nextStreak(p.lastActiveDate, today, p.streak);
  if (p.lastActiveDate !== today)
    ledger.push({ kind: 'streak', coins: 0, xp: streakXp(streak), at });

  const afterVisit: DemoProgress = {
    ...p,
    ledger,
    streak,
    lastActiveDate: today,
    unlocked: {
      ...p.unlocked,
      [place.id]: { at, points: visitCoins, visitorsBefore: n, firstDiscoverer: n === 0 },
    },
  };
  const { progress, newBadges, collectionsCompleted } = applyBadgesAndCollections(
    afterVisit,
    places,
    now,
  );
  return {
    progress,
    result: {
      coins: pts.total,
      firstDiscovererBonus: pts.firstDiscovererBonus,
      multiplier: pts.multiplier,
      streak,
      level: walletOf(progress).level,
      newBadges,
      collectionsCompleted,
    },
  };
}

/** Daily challenge pays double: the bonus equals the best qualifying discovery's coins. */
export function applyDailyChallenge(
  p: DemoProgress,
  qualifyingPlaceIds: string[],
  challengeId: string,
  places: Place[],
  now: Date,
): { progress: DemoProgress; bonus: number; newBadges: string[] } {
  const bonus = Math.max(
    DAILY_CHALLENGE_BONUS,
    ...qualifyingPlaceIds.map((id) => p.unlocked[id]?.points ?? 0),
  );
  const at = now.toISOString();
  const next: DemoProgress = {
    ...p,
    challengesCompleted: p.challengesCompleted + 1,
    ledger: [
      ...p.ledger,
      { kind: 'daily_challenge', coins: bonus, xp: bonus, at, ref: challengeId },
    ],
  };
  const { progress, newBadges } = applyBadgesAndCollections(next, places, now);
  return { progress, bonus, newBadges };
}

/** Spending coins never reduces XP or rank. */
export function applyPurchase(
  p: DemoProgress,
  itemCode: string,
  price: number,
  now: Date,
): DemoProgress | null {
  if (walletOf(p).coins < price) return null;
  return {
    ...p,
    ledger: [
      ...p.ledger,
      { kind: 'purchase', coins: -price, xp: 0, at: now.toISOString(), ref: itemCode },
    ],
  };
}
