import { BASE_POINTS, FIRST_DISCOVERER_BONUS } from './constants';
import type { Category } from './types';

/**
 * 1 + 4 / (1 + n / 10), where n = unique visitors so far.
 * n=0 -> 5x, n=10 -> 3x, n=100 -> ~1.36x, n=1000 -> ~1.04x.
 */
export function rarityMultiplier(uniqueVisitors: number): number {
  const n = Math.max(0, uniqueVisitors);
  return 1 + 4 / (1 + n / 10);
}

export interface PointsBreakdown {
  base: number;
  multiplier: number;
  firstDiscovererBonus: number;
  total: number;
}

export function pointsForVisit(
  category: Category,
  uniqueVisitors: number,
  basePoints: number = BASE_POINTS[category],
): PointsBreakdown {
  const multiplier = rarityMultiplier(uniqueVisitors);
  const firstDiscovererBonus = uniqueVisitors === 0 ? FIRST_DISCOVERER_BONUS : 0;
  const total = Math.round(basePoints * multiplier) + firstDiscovererBonus;
  return { base: basePoints, multiplier, firstDiscovererBonus, total };
}

/** level = floor(sqrt(xp / 100)) + 1 */
export function levelFromXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
}

/** Minimum XP needed to reach a level. */
export function xpForLevel(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return (l - 1) * (l - 1) * 100;
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  fraction: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const xpIntoLevel = Math.max(0, xp) - floor;
  const xpForNext = next - floor;
  return { level, xpIntoLevel, xpForNext, fraction: xpIntoLevel / xpForNext };
}

export const OCTOPUS_STAGES = [
  { minLevel: 1, name: 'Hatchling' },
  { minLevel: 3, name: 'Explorer' },
  { minLevel: 6, name: 'Navigator' },
  { minLevel: 10, name: 'Cartographer' },
] as const;

export function octopusStage(level: number): string {
  let name: string = OCTOPUS_STAGES[0].name;
  for (const s of OCTOPUS_STAGES) if (level >= s.minLevel) name = s.name;
  return name;
}
