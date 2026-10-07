import type { Category } from '@wandro/shared';

/** Fictional explorers that make demo mode feel alive. Clearly labelled "demo" in the UI. */
export interface DemoUser {
  id: string;
  username: string;
  homeCity: string;
  isPrivate: boolean;
  /** Matches their XP: 50 per discovery (see levelFromXp). */
  level: number;
  coins: number;
  discoveries: number;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'demo-user-ines',
    username: 'ines.wanders',
    homeCity: 'Lisbon',
    isPrivate: false,
    level: 3,
    coins: 3120,
    discoveries: 18,
  },
  {
    id: 'demo-user-tomas',
    username: 'tomas_trails',
    homeCity: 'Sintra',
    isPrivate: false,
    level: 2,
    coins: 1980,
    discoveries: 9,
  },
  {
    id: 'demo-user-sofia',
    username: 'sofia.sees',
    homeCity: 'Cascais',
    isPrivate: false,
    level: 4,
    coins: 5400,
    discoveries: 38,
  },
  {
    id: 'demo-user-joao',
    username: 'joao_on_foot',
    homeCity: 'Porto',
    isPrivate: true,
    level: 2,
    coins: 1150,
    discoveries: 6,
  },
  {
    id: 'demo-user-mia',
    username: 'mia.maps',
    homeCity: 'Porto',
    isPrivate: false,
    level: 3,
    coins: 2600,
    discoveries: 16,
  },
];

export const demoUser = (id: string) => DEMO_USERS.find((u) => u.id === id);

export const DEMO_SUBMISSION_CATEGORIES: Category[] = [
  'culture',
  'heritage',
  'nature',
  'art',
  'music_events',
  'other',
];
