import type { PlaceDetails } from '../types';

/** Facts researched from the linked pages rather than supplied by a curator wait for review. */
export function flagForReview(details: Record<string, PlaceDetails>): Record<string, PlaceDetails> {
  return Object.fromEntries(
    Object.entries(details).map(([id, d]) => [
      id,
      { ...d, facts: d.facts.map((f) => ({ ...f, needsReview: true })) },
    ]),
  );
}
