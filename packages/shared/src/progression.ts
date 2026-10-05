import type { Category } from './types';

/** Next streak value given the last active day and today (YYYY-MM-DD, Lisbon calendar on the server). */
export function nextStreak(lastActive: string | null, today: string, current: number): number {
  if (lastActive === today) return Math.max(current, 1);
  if (lastActive && daysBetween(lastActive, today) === 1) return current + 1;
  return 1;
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export type BadgeCriteria =
  | { type: 'total_visits'; count: number }
  | { type: 'category_count'; category: Category; count: number }
  | { type: 'rare_visit'; maxVisitors: number }
  | { type: 'first_discoverer'; count: number }
  | { type: 'region_complete'; region: string }
  | { type: 'streak'; days: number }
  | { type: 'daily_challenges'; count: number };

export interface BadgeDef {
  code: string;
  name: string;
  description: string;
  emoji: string;
  criteria: BadgeCriteria;
}

/** Mirrors the `badges` seed in supabase/migrations (same codes). */
export const BADGES: BadgeDef[] = [
  {
    code: 'first_step',
    name: 'First step',
    description: 'Discover your first place.',
    emoji: '👣',
    criteria: { type: 'total_visits', count: 1 },
  },
  {
    code: 'explorer_10',
    name: 'Explorer',
    description: 'Discover 10 places.',
    emoji: '🧭',
    criteria: { type: 'total_visits', count: 10 },
  },
  {
    code: 'heritage_3',
    name: '3 heritage sites',
    description: 'Discover 3 heritage sites.',
    emoji: '🏰',
    criteria: { type: 'category_count', category: 'heritage', count: 3 },
  },
  {
    code: 'castle_keeper',
    name: 'Castle keeper',
    description: 'Discover 5 heritage sites.',
    emoji: '👑',
    criteria: { type: 'category_count', category: 'heritage', count: 5 },
  },
  {
    code: 'nature_5',
    name: 'Wild at heart',
    description: 'Discover 5 nature spots.',
    emoji: '🌿',
    criteria: { type: 'category_count', category: 'nature', count: 5 },
  },
  {
    code: 'culture_5',
    name: 'Culture vulture',
    description: 'Discover 5 museums or cultural places.',
    emoji: '🎨',
    criteria: { type: 'category_count', category: 'culture', count: 5 },
  },
  {
    code: 'hidden_gem',
    name: 'Hidden gem hunter',
    description: 'Discover a place fewer than 10 explorers have found.',
    emoji: '💎',
    criteria: { type: 'rare_visit', maxVisitors: 10 },
  },
  {
    code: 'first_discoverer',
    name: 'Pioneer',
    description: 'Be the very first to discover a place.',
    emoji: '🚩',
    criteria: { type: 'first_discoverer', count: 1 },
  },
  {
    code: 'sintra_complete',
    name: 'Sintra complete',
    description: 'Discover every place in Sintra.',
    emoji: '🌄',
    criteria: { type: 'region_complete', region: 'sintra' },
  },
  {
    code: 'streak_7',
    name: 'On a roll',
    description: 'Explore 7 days in a row.',
    emoji: '🔥',
    criteria: { type: 'streak', days: 7 },
  },
  {
    code: 'challenger',
    name: 'Challenge accepted',
    description: 'Complete a daily challenge.',
    emoji: '⚡',
    criteria: { type: 'daily_challenges', count: 1 },
  },
  {
    code: 'challenger_7',
    name: 'Daily devotee',
    description: 'Complete 7 daily challenges.',
    emoji: '🌟',
    criteria: { type: 'daily_challenges', count: 7 },
  },
];

export interface ProgressStats {
  visits: {
    category: Category;
    visitorsBefore: number;
    firstDiscoverer: boolean;
    region?: string;
  }[];
  regionPlaceCounts: Record<string, number>;
  streak: number;
  dailyChallenges: number;
}

export function qualifies(c: BadgeCriteria, s: ProgressStats): boolean {
  switch (c.type) {
    case 'total_visits':
      return s.visits.length >= c.count;
    case 'category_count':
      return s.visits.filter((v) => v.category === c.category).length >= c.count;
    case 'rare_visit':
      return s.visits.some((v) => v.visitorsBefore < c.maxVisitors);
    case 'first_discoverer':
      return s.visits.filter((v) => v.firstDiscoverer).length >= c.count;
    case 'region_complete': {
      const total = s.regionPlaceCounts[c.region] ?? 0;
      return total > 0 && s.visits.filter((v) => v.region === c.region).length >= total;
    }
    case 'streak':
      return s.streak >= c.days;
    case 'daily_challenges':
      return s.dailyChallenges >= c.count;
  }
}

export function newlyEarnedBadges(stats: ProgressStats, owned: Set<string>): BadgeDef[] {
  return BADGES.filter((b) => !owned.has(b.code) && qualifies(b.criteria, stats));
}
