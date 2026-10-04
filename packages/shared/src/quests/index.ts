import type { Place } from '../types';
import { CENTRAL_QUESTS } from './central';
import { DANUBE_ISLES_QUESTS } from './danube-isles';
import { NORTH_QUESTS } from './north';
import { PORTUGAL_QUESTS } from './portugal';
import { SPAIN_QUESTS } from './spain';

/**
 * Side quests: with the launch places, every city has 5+ to do in each category. Cities outside
 * Portugal are kept but hidden for now (see HIDDEN_REGIONS).
 */
export const EUROPE_QUESTS: Place[] = [
  ...PORTUGAL_QUESTS,
  ...SPAIN_QUESTS,
  ...CENTRAL_QUESTS,
  ...DANUBE_ISLES_QUESTS,
  ...NORTH_QUESTS,
];
