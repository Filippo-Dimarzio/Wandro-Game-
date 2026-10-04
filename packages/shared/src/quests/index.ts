import type { Place } from '../types';
import { CULTURE_THEME_QUESTS } from './culture';
import { PORTUGAL_QUESTS } from './portugal';

/** Side quests: with the launch places, every city has 5+ to do in each category. */
export const EUROPE_QUESTS: Place[] = [...PORTUGAL_QUESTS, ...CULTURE_THEME_QUESTS];
