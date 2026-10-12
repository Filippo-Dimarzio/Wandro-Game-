import { REGIONS } from '@wandro/shared';

/** Portuguese spellings people type for the launch cities. */
const ALIASES: Record<string, string> = { lisboa: 'lisbon', oporto: 'porto' };

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

/**
 * The home city as the profile shows it: a launch city gets its proper name and flag ("lisbon" →
 * 🇵🇹 Lisbon); anything else keeps what the player typed, capitalised, with a pin.
 */
export function homeCityLabel(typed: string | undefined): { flag: string; name: string } | null {
  const key = plain(typed ?? '');
  if (!key) return null;
  const region = REGIONS.find(
    (r) => r.slug === (ALIASES[key] ?? key) || plain(r.name) === (ALIASES[key] ?? key),
  );
  if (region) return { flag: region.flag, name: region.name };
  const name = typed!.trim().replace(/(^|\s)\S/g, (ch) => ch.toUpperCase());
  return { flag: '📍', name };
}
