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

/** A piece of kit your explorer carries from a rank onwards (drawn on the avatar). */
export type ExplorerKit = 'map' | 'backpack' | 'camera';

/** Explorer ranks: your explorer's kit grows as you level up. */
export const EXPLORER_STAGES = [
  { minLevel: 1, name: 'Wanderer', kit: null },
  { minLevel: 3, name: 'Explorer', kit: 'map' },
  { minLevel: 6, name: 'Navigator', kit: 'backpack' },
  { minLevel: 10, name: 'Cartographer', kit: 'camera' },
] as const satisfies readonly { minLevel: number; name: string; kit: ExplorerKit | null }[];

function stageFor(level: number) {
  let stage: (typeof EXPLORER_STAGES)[number] = EXPLORER_STAGES[0];
  for (const s of EXPLORER_STAGES) if (level >= s.minLevel) stage = s;
  return stage;
}

export function explorerStage(level: number): string {
  return stageFor(level).name;
}

export function explorerKit(level: number): ExplorerKit | null {
  return stageFor(level).kit;
}
