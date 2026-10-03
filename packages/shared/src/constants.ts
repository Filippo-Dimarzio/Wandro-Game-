import type { Category } from './types';

export const DEFAULT_GEOFENCE_RADIUS_M = 75;
export const DEFAULT_DWELL_SECONDS = 120;
export const MAX_ACCURACY_M = 50;

export const CATEGORIES: readonly Category[] = [
  'coast',
  'nature',
  'heritage',
  'culture',
  'music_events',
  'other',
];

/** Base points per category; rarity multiplier is applied on top. */
export const BASE_POINTS: Record<Category, number> = {
  coast: 80,
  culture: 100,
  heritage: 120,
  nature: 80,
  music_events: 100,
  other: 60,
};

export const FIRST_DISCOVERER_BONUS = 50;
export const DAILY_CHALLENGE_BONUS = 75;
export const COLLECTION_COMPLETION_BONUS = 200;

/** Daily challenge pays the qualifying discovery's coins again (double coins). */
export const DAILY_CHALLENGE_MULTIPLIER = 2;
export const STREAK_XP_PER_DAY = 10;
export const STREAK_XP_CAP_DAYS = 7;
export const BADGE_XP = 50;
/** How often the app sends a location ping during a check-in. */
export const PING_INTERVAL_SECONDS = 5;
/** Accuracy slack added to the geofence radius, capped so bad GPS can't stretch it far. */
export const ACCURACY_TOLERANCE_CAP_M = 25;
/** On foot, anything faster than this between pings is a teleport. */
export const MAX_PING_SPEED_MPS = 50;

/** Hidden gems appear on the map once the player is this close. */
export const HIDDEN_REVEAL_RADIUS_M = 200;
/** Places further than this aren't loaded or hinted at (matches nearby_places). */
export const NEARBY_RADIUS_M = 30_000;
/** Friend challenge notes are short ideas, not chat. */
export const FRIEND_NOTE_MAX = 280;
/** Anti-spam: challenges one player can send per day. */
export const FRIEND_CHALLENGES_PER_DAY = 20;
