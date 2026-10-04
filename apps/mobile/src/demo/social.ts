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

export interface DemoFeedPost {
  id: string;
  userId: string;
  placeId: string;
  caption: string;
  hoursAgo: number;
  likes: number;
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
    homeCity: 'Madrid',
    isPrivate: false,
    level: 5,
    coins: 2600,
    weeklyCoins: 120,
    discoveries: 11,
  },
];

export const DEMO_FEED: DemoFeedPost[] = [
  {
    id: 'demo-post-1',
    userId: 'demo-user-ines',
    placeId: 'demo-capuchos',
    caption: 'Cork walls and total silence. Felt like time stopped.',
    hoursAgo: 2,
    likes: 24,
  },
  {
    id: 'demo-post-2',
    userId: 'demo-user-tomas',
    placeId: 'demo-cruz-alta',
    caption: 'Highest point of the hills — the fog lifted just for us 🌫️',
    hoursAgo: 5,
    likes: 41,
  },
  {
    id: 'demo-post-3',
    userId: 'demo-user-sofia',
    placeId: 'demo-adraga',
    caption: 'Low tide = secret arches. Go before sunset.',
    hoursAgo: 20,
    likes: 87,
  },
  {
    id: 'demo-post-4',
    userId: 'demo-user-ines',
    placeId: 'demo-brinquedo',
    caption: 'Did not expect a toy museum to be this charming.',
    hoursAgo: 30,
    likes: 12,
  },
  {
    id: 'demo-post-5',
    userId: 'demo-user-mia',
    placeId: 'demo-monserrate',
    caption: 'The gardens are a whole world of their own.',
    hoursAgo: 48,
    likes: 33,
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
