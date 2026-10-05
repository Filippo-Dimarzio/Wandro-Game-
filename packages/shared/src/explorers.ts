/**
 * The explorers a player can choose as their avatar. Each is drawn (assets/explorers, rendered by
 * apps/mobile/scripts/render-explorers.mjs) in every outfit colour; the database only accepts these
 * ids (profiles.explorer), and catalog-sync.test.ts keeps the two lists equal.
 *
 * The look of each one lives in the render script; here we only need ids and the order shown in
 * the picker. Screen-reader descriptions live in the i18n layer (`explorer.<id>`).
 */
export const EXPLORER_IDS = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'] as const;

export type ExplorerId = (typeof EXPLORER_IDS)[number];

export const DEFAULT_EXPLORER: ExplorerId = 'e1';

export function isExplorerId(value: unknown): value is ExplorerId {
  return typeof value === 'string' && (EXPLORER_IDS as readonly string[]).includes(value);
}

/**
 * The explorer to draw for a player: their own choice when we know it, otherwise one picked
 * steadily from their id, so a player who hasn't chosen yet always looks the same everywhere.
 */
export function explorerFor(userId: string, chosen?: string | null): ExplorerId {
  if (isExplorerId(chosen)) return chosen;
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  return EXPLORER_IDS[h % EXPLORER_IDS.length]!;
}
