import type { Category } from '@wandro/shared';

/** Fictional explorers that make demo mode feel alive. Clearly labelled "demo" in the UI. */
export interface DemoUser {
  id: string;
  username: string;
  homeCity: string;
  isPrivate: boolean;
  level: number;
  coins: number;
  weeklyCoins: number;
  discoveries: number;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'demo-user-ines',
    username: 'ines.wanders',
    homeCity: 'Lisbon',
    isPrivate: false,
    level: 6,
    coins: 3120,
    weeklyCoins: 640,
    discoveries: 14,
  },
  {
    id: 'demo-user-tomas',
    username: 'tomas_trails',
    homeCity: 'Sintra',
    isPrivate: false,
    level: 4,
    coins: 1980,
    weeklyCoins: 910,
    discoveries: 9,
  },
  {
    id: 'demo-user-sofia',
    username: 'sofia.sees',
    homeCity: 'Cascais',
    isPrivate: false,
    level: 8,
    coins: 5400,
    weeklyCoins: 300,
    discoveries: 22,
  },
  {
    id: 'demo-user-joao',
    username: 'joao_on_foot',
    homeCity: 'Porto',
    isPrivate: true,
    level: 3,
    coins: 1150,
    weeklyCoins: 450,
    discoveries: 6,
  },
  {
    id: 'demo-user-mia',
    username: 'mia.maps',
    homeCity: 'Porto',
    isPrivate: false,
    level: 5,
    coins: 2600,
    weeklyCoins: 120,
    discoveries: 11,
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
