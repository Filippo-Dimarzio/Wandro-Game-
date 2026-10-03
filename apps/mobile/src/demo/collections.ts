import type { Place } from '@wandro/shared';

export interface CollectionDef {
  id: string;
  title: string;
  description: string;
  colors: [string, string];
  placeIds: string[];
  bonus: number;
}

/** Curated demo collections (with a backend these come from the `collections` table). */
export const DEMO_COLLECTIONS: CollectionDef[] = [
  {
    id: 'demo-col-palaces',
    title: "Sintra's palaces",
    description: 'Romantic palaces, castles and estates in the hills.',
    colors: ['#B7791F', '#3C2A0A'],
    placeIds: ['demo-pena', 'demo-regaleira', 'demo-mouros', 'demo-monserrate', 'demo-condessa'],
    bonus: 200,
  },
  {
    id: 'demo-col-coast',
    title: 'The wild coast',
    description: 'Cliffs, coves and the westernmost point of Europe.',
    colors: ['#2B6CB0', '#0A2540'],
    placeIds: ['demo-cabo', 'demo-adraga'],
    bonus: 200,
  },
  {
    id: 'demo-col-gems',
    title: 'Hidden gems',
    description: 'Places fewer than 20 explorers have found.',
    colors: ['#2F855A', '#0B2A24'],
    placeIds: ['demo-condessa', 'demo-cruz-alta', 'demo-brinquedo', 'demo-music'],
    bonus: 200,
  },
];

export function collectionPlaces(c: CollectionDef, places: Place[]): Place[] {
  return c.placeIds.map((id) => places.find((p) => p.id === id)).filter((p): p is Place => !!p);
}
