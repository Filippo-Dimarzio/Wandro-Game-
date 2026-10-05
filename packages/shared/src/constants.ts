import type { Category } from './types';

export const DEFAULT_GEOFENCE_RADIUS_M = 75;
export const DEFAULT_DWELL_SECONDS = 120;
export const MAX_ACCURACY_M = 50;

export const CATEGORIES: readonly Category[] = [
  'coast',
  'nature',
  'heritage',
  'culture',
  'art',
  'music_events',
  'other',
];

/** Base points per category; rarity multiplier is applied on top. */
export const BASE_POINTS: Record<Category, number> = {
  coast: 80,
  culture: 100,
  art: 100,
  heritage: 120,
  nature: 80,
  music_events: 100,
  other: 60,
};

export const FIRST_DISCOVERER_BONUS = 50;
export const DAILY_CHALLENGE_BONUS = 75;
/** Finishing a whole set (5–6 places). */
export const COLLECTION_COMPLETION_BONUS = 50;
/** Each place you discover from a set pays this on top of its own coins. */
export const COLLECTION_STEP_BONUS = 20;

/** Daily challenge pays the qualifying discovery's coins again (double coins). */
export const DAILY_CHALLENGE_MULTIPLIER = 2;
/**
 * XP is separate from coins: every completed challenge (a discovered place or a daily challenge)
 * gives the same XP, however rare or valuable it was. 5 challenges = 250 XP = level 2.
 */
export const CHALLENGE_XP = 50;
/** XP from level 1 to level 2; each next level needs twice as much as the one before. */
export const LEVEL_UP_XP = 250;
/** How often the app sends a location ping during a check-in. */
export const PING_INTERVAL_SECONDS = 5;
/** Accuracy slack added to the geofence radius, capped so bad GPS can't stretch it far. */
export const ACCURACY_TOLERANCE_CAP_M = 25;
/** On foot, anything faster than this between pings is a teleport. */
export const MAX_PING_SPEED_MPS = 50;

/** A city's hidden gems all appear once you've discovered this many places there. */
export const GEMS_UNLOCK_AFTER = 5;
/** Hidden gems appear on the map once the player is this close. */
export const HIDDEN_REVEAL_RADIUS_M = 200;
/** Places further than this aren't loaded or hinted at (matches nearby_places). */
export const NEARBY_RADIUS_M = 30_000;
/** Friend challenge notes are short ideas, not chat. */
export const FRIEND_NOTE_MAX = 280;
/** Anti-spam: challenges one player can send per day. */
export const FRIEND_CHALLENGES_PER_DAY = 20;
/** Others' moments disappear from the feed after this; the author keeps theirs in their passport. */
export const MOMENT_VISIBLE_HOURS = 24;
