import type { PlaceDetails } from '../types';
import { LISBON_DETAILS } from './lisbon';
import { SINTRA_DETAILS } from './sintra';

/** Learn and Plan content by place id: Sintra (the pilot) and Lisbon. */
export const PLACE_DETAILS: Record<string, PlaceDetails> = { ...SINTRA_DETAILS, ...LISBON_DETAILS };

// The seed's source_id for a demo place id (the Sintra music corner predates the naming rule).
const SOURCE_ID_OVERRIDES: Record<string, string> = { 'demo-music': 'music-corner' };
export const seedSourceId = (id: string) => SOURCE_ID_OVERRIDES[id] ?? id.replace(/^demo-/, '');

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

/** One UPDATE per place, so the database carries the same details as demo mode. */
export function detailsSql(details: Record<string, PlaceDetails> = PLACE_DETAILS): string {
  return Object.entries(details)
    .map(
      ([id, d]) =>
        `update public.places set details = ${q(JSON.stringify(d))}::jsonb where source = 'seed' and source_id = ${q(seedSourceId(id))};`,
    )
    .join('\n');
}
