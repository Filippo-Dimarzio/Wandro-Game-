/**
 * The beta waitlist (the /join page). The questions are short on purpose: who the player is, how
 * they get around and what they'd explore first, so the market test can see whether the people
 * signing up are the students and young workers Wandro is for.
 */
export const WAITLIST_LIVES = ['lisbon', 'sintra', 'porto', 'portugal', 'visiting'] as const;
export const WAITLIST_OCCUPATIONS = ['study', 'work', 'both', 'other'] as const;
export const WAITLIST_TRANSPORT = ['metro', 'train', 'bus_tram', 'walk', 'bike', 'car'] as const;
export const WAITLIST_INTERESTS = [
  'coast',
  'nature',
  'heritage',
  'culture',
  'art',
  'music_events',
  'other',
] as const;
export const WAITLIST_FOG_WALK = ['yes', 'maybe', 'no'] as const;

export interface WaitlistSignup {
  email: string;
  firstName?: string;
  livesIn: (typeof WAITLIST_LIVES)[number];
  occupation: (typeof WAITLIST_OCCUPATIONS)[number];
  transport: (typeof WAITLIST_TRANSPORT)[number][];
  interests: (typeof WAITLIST_INTERESTS)[number][];
  fogWalk: (typeof WAITLIST_FOG_WALK)[number];
  /** Must be true: the player agreed to be emailed about the beta. */
  consent: boolean;
  /** Where the visitor came from (?src= on the link), e.g. instagram, ads-a, erasmus. */
  source?: string;
}

export type WaitlistField = 'email' | 'livesIn' | 'occupation' | 'fogWalk' | 'consent';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Fields that still need an answer before the sign-up can be sent (empty when it's complete). */
export function waitlistErrors(s: Partial<WaitlistSignup>): WaitlistField[] {
  const missing: WaitlistField[] = [];
  if (!s.email || !EMAIL.test(s.email.trim())) missing.push('email');
  if (!s.livesIn) missing.push('livesIn');
  if (!s.occupation) missing.push('occupation');
  if (!s.fogWalk) missing.push('fogWalk');
  if (!s.consent) missing.push('consent');
  return missing;
}

/** Keeps the link source short and plain, so a tagged link can't stuff the sheet. */
export function cleanSource(src: unknown): string | undefined {
  if (typeof src !== 'string') return undefined;
  const s = src
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 32);
  return s || undefined;
}
