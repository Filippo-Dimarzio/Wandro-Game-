import type { Category } from './types';

/** Store catalogue. Coins are only ever earned by playing; nothing here affects points or rank. */
export type ShopItemKind = 'boost' | 'skin' | 'hat';

/** A challenge to complete before an item can be bought. Checked by buy_item() on the server. */
export type ShopUnlock =
  { kind: 'category'; category: Category; count: number } | { kind: 'stamps'; count: number };

export interface ShopItem {
  code: string;
  name: string;
  description: string;
  kind: ShopItemKind;
  price: number;
  /** Timed boosts; buying again extends the timer. */
  durationMinutes?: number;
  /** One-use boosts: held until used up, one at a time. */
  consumable?: boolean;
  /** Skin colour for the octopus. */
  color?: string;
  /** Complete this first; then the item can be bought. */
  unlock?: ShopUnlock;
  /** The unlock challenge in words, shown in the store. */
  challenge?: string;
  emoji: string;
}

export const DEFAULT_SKIN_COLOR = '#0E7C66';

/** Mirrors the `shop_items` seed in supabase/migrations (same codes and prices). */
export const SHOP_ITEMS: ShopItem[] = [
  {
    code: 'incense_30',
    name: 'Incense trail · 30 min',
    description:
      'A glowing incense circle around your octopus and a guiding line to your next adventure.',
    kind: 'boost',
    price: 150,
    durationMinutes: 30,
    emoji: '🪔',
  },
  {
    code: 'incense_120',
    name: 'Incense trail · 2 hours',
    description: 'The incense trail for a whole afternoon of exploring.',
    kind: 'boost',
    price: 400,
    durationMinutes: 120,
    emoji: '🪔',
  },
  {
    code: 'skin_ocean',
    name: 'Ocean octopus',
    description: 'Deep Atlantic blue, with sea-foam suckers.',
    unlock: { kind: 'category', category: 'coast', count: 3 },
    challenge: 'Discover 3 beaches & coast spots.',
    kind: 'skin',
    price: 300,
    color: '#2B6CB0',
    emoji: '🌊',
  },
  {
    code: 'skin_coral',
    name: 'Coral octopus',
    description: 'Warm coral, the colour of Pena Palace’s walls.',
    unlock: { kind: 'category', category: 'heritage', count: 5 },
    challenge: 'Discover 5 heritage sites.',
    kind: 'skin',
    price: 450,
    color: '#C05621',
    emoji: '🪸',
  },
  {
    code: 'skin_midnight',
    name: 'Midnight octopus',
    description: 'Ink-dark night blue that glows under the stars.',
    unlock: { kind: 'category', category: 'music_events', count: 2 },
    challenge: 'Discover 2 music & events spots.',
    kind: 'skin',
    price: 600,
    color: '#2D3748',
    emoji: '🌙',
  },
  {
    code: 'skin_gold',
    name: 'Golden octopus',
    description: 'Polished gold from tentacle to tip.',
    unlock: { kind: 'stamps', count: 3 },
    challenge: 'Collect 3 city stamps.',
    kind: 'skin',
    price: 1200,
    color: '#B7791F',
    emoji: '✨',
  },
  {
    code: 'hat_flower',
    name: 'Sintra flower',
    description: 'A hibiscus from the palace gardens.',
    kind: 'hat',
    price: 200,
    emoji: '🌺',
  },
  {
    code: 'hat_cap',
    name: 'Trail cap',
    description: 'Keeps the sun off on long walks.',
    kind: 'hat',
    price: 250,
    emoji: '🧢',
  },
  {
    code: 'hat_top',
    name: 'Explorer top hat',
    description: 'For the distinguished cartographer.',
    kind: 'hat',
    price: 700,
    emoji: '🎩',
  },
  {
    code: 'hat_crown',
    name: 'Palace crown',
    description: 'Fit for the hills of Sintra.',
    kind: 'hat',
    price: 1500,
    emoji: '👑',
  },
  {
    code: 'time_key',
    name: 'Time-of-day key · 24 h',
    description:
      'Opens golden-hour and night quests: discover those places in their window for +40 coins.',
    kind: 'boost',
    price: 200,
    durationMinutes: 1440,
    emoji: '🗝️',
  },
  {
    code: 'stamp_ink',
    name: 'Gold stamp ink',
    description: 'The next new city you collect gets a rare gold postmark on its stamp.',
    kind: 'boost',
    price: 250,
    consumable: true,
    emoji: '🖋️',
  },
  {
    code: 'friend_beacon',
    name: 'Friend beacon',
    description: 'Light it on a friend challenge: if it’s done today, you both get +50 coins.',
    kind: 'boost',
    price: 150,
    consumable: true,
    emoji: '🔥',
  },
];

export const TRAIL_ITEM_CODES = SHOP_ITEMS.filter((i) => i.code.startsWith('incense')).map(
  (i) => i.code,
);

export function shopItem(code: string | undefined): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.code === code);
}

export function skinColor(code: string | undefined): string {
  return shopItem(code)?.color ?? DEFAULT_SKIN_COLOR;
}

/** True while a timed boost bought with `code` is still running. */
export function isBoostActive(
  activeUntil: Record<string, string>,
  code: string,
  now = Date.now(),
): boolean {
  return Date.parse(activeUntil[code] ?? '') > now;
}

/** True if any trail boost is still running at `now`. */
export function isTrailActive(activeUntil: Record<string, string>, now = Date.now()): boolean {
  return TRAIL_ITEM_CODES.some((c) => Date.parse(activeUntil[c] ?? '') > now);
}

export function trailEndsAt(activeUntil: Record<string, string>): number {
  return Math.max(0, ...TRAIL_ITEM_CODES.map((c) => Date.parse(activeUntil[c] ?? '') || 0));
}

/** What a player has done, for checking store unlocks (demo mode; the server counts the same). */
export interface UnlockStats {
  categoryCounts: Partial<Record<Category, number>>;
  cityStamps: number;
}

/** Progress towards an item's unlock challenge, or null if it has none. */
export function unlockProgress(
  item: ShopItem,
  stats: UnlockStats,
): { done: number; total: number; met: boolean } | null {
  const u = item.unlock;
  if (!u) return null;
  const done = u.kind === 'stamps' ? stats.cityStamps : (stats.categoryCounts[u.category] ?? 0);
  return { done: Math.min(done, u.count), total: u.count, met: done >= u.count };
}
