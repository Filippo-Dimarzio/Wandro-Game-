import type { Place } from '../types';
import { CENTRAL_QUESTS } from './central';
import { DANUBE_ISLES_QUESTS } from './danube-isles';
import { IBERIA_QUESTS } from './iberia';
import { NORTH_QUESTS } from './north';

/** Side quests: with the launch places, every city has 5+ to do in each category. */
export const EUROPE_QUESTS: Place[] = [
  ...IBERIA_QUESTS,
  ...CENTRAL_QUESTS,
  ...DANUBE_ISLES_QUESTS,
  ...NORTH_QUESTS,
];
