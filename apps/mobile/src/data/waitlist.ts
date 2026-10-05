import { useMutation } from '@tanstack/react-query';
import type { WaitlistSignup } from '@wandro/shared';
import { env, isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';

/** Thrown when the page has nowhere to send sign-ups yet (no backend and no sheet link). */
export class WaitlistNotConnected extends Error {
  constructor() {
    super('waitlist_not_connected');
  }
}

/**
 * Sends a beta sign-up. With a backend it goes to the `waitlist` table; on the demo site it goes
 * to the Google Sheet behind EXPO_PUBLIC_WAITLIST_URL (see docs/waitlist). Apps Script web apps
 * don't answer cross-site requests, so the sheet is sent a plain-text POST and the reply isn't read.
 */
export async function sendSignup(s: WaitlistSignup): Promise<void> {
  if (!isDemo && supabase) {
    const { error } = await supabase.from('waitlist').insert({
      email: s.email.trim(),
      first_name: s.firstName?.trim() || null,
      lives_in: s.livesIn,
      occupation: s.occupation,
      transport: s.transport,
      interests: s.interests,
      fog_walk: s.fogWalk,
      consent: s.consent,
      source: s.source ?? null,
    });
    // Already on the list counts as success: they're in.
    if (error && error.code !== '23505') throw error;
    return;
  }
  if (!env.waitlistUrl) throw new WaitlistNotConnected();
  await fetch(env.waitlistUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...s, email: s.email.trim(), submittedAt: new Date().toISOString() }),
  });
}

export function useJoinWaitlist() {
  return useMutation({ mutationFn: sendSignup });
}
