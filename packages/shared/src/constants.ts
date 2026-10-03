import type { Category } from './types';

export const DEFAULT_GEOFENCE_RADIUS_M = 75;
export const DEFAULT_DWELL_SECONDS = 120;
export const MAX_ACCURACY_M = 50;

export const CATEGORIES: readonly Category[] = [
  'culture',
  'heritage',
  'nature',
  'music_events',
  'other',
];

/** Base points per category; rarity multiplier is applied on top. */
export const BASE_POINTS: Record<Category, number> = {
  culture: 100,
  heritage: 120,
  nature: 80,
  music_events: 100,
  other: 60,
};

export const FIRST_DISCOVERER_BONUS = 50;
export const DAILY_CHALLENGE_BONUS = 75;
export const COLLECTION_COMPLETION_BONUS = 200;
