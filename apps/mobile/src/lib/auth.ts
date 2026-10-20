import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

/**
 * A link back into the app for auth emails and sign-in redirects. On the web it keeps the site's
 * base path (GitHub Pages serves the app under /<repo>), which Linking.createURL drops.
 */
export function appLink(path: string): string {
  if (Platform.OS !== 'web') return Linking.createURL(path);
  if (typeof window === 'undefined') return path;
  const base = (process.env.EXPO_PUBLIC_BASE_URL ?? '').replace(/\/$/, '');
  return `${window.location.origin}${base}${path}`;
}

export function useAuthSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!!supabase);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, loading };
}

/** Google / Apple sign-in through Supabase OAuth (PKCE). */
export async function signInWithProvider(provider: 'google' | 'apple'): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const redirectTo = appLink('/register');
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) throw error;
    return;
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return;
  const code = new URL(result.url).searchParams.get('code');
  if (code) {
    const { error: e2 } = await supabase.auth.exchangeCodeForSession(code);
    if (e2) throw e2;
  }
}
