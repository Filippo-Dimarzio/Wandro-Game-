import type { Category, Place } from '@wandro/shared';

export interface CollectionDef {
  id: string;
  title: string;
  description: string;
  /** Cover art and colour come from this category. */
  theme: Category;
  placeIds: string[];
  bonus: number;
}

/** Curated demo collections (with a backend these come from the `collections` table). */
export const DEMO_COLLECTIONS: CollectionDef[] = [
  {
    id: 'demo-col-palaces',
    title: "Sintra's palaces",
    description: 'Romantic palaces, castles and estates in the hills.',
    theme: 'heritage',
    placeIds: ['demo-pena', 'demo-regaleira', 'demo-mouros', 'demo-monserrate', 'demo-condessa'],
    bonus: 200,
  },
  {
    id: 'demo-col-coast',
    title: 'The wild coast',
    description: 'Cliffs, coves and the westernmost point of Europe.',
    theme: 'coast',
    placeIds: ['demo-cabo', 'demo-adraga'],
    bonus: 200,
  },
  {
    id: 'demo-col-gems',
    title: 'Hidden gems',
    description: 'Places fewer than 20 explorers have found.',
    theme: 'other',
    placeIds: ['demo-condessa', 'demo-cruz-alta', 'demo-brinquedo', 'demo-music'],
    bonus: 200,
  },
];

export function collectionPlaces(c: CollectionDef, places: Place[]): Place[] {
  return c.placeIds.map((id) => places.find((p) => p.id === id)).filter((p): p is Place => !!p);
}
