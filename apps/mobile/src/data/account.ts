import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { cleanSocialLinks, type SocialLinks } from '@wandro/shared';
import { DEMO_USERS } from '@/demo/social';
import { isDemo } from '@/lib/env';
import { saveJson } from '@/lib/download';
import { supabase } from '@/lib/supabase';
import { useSession, type LocalProfile } from '@/state/session';

/**
 * A returning player's profile from the server, or null if they never finished sign-up
 * (sign-up always picks at least one explorer style).
 */
export async function loadServerProfile(userId: string): Promise<LocalProfile | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('profiles')
    .select('username, home_city, explorer_styles, explorer, is_private, social_links')
    .eq('id', userId)
    .maybeSingle();
  if (!data?.explorer_styles?.length) return null;
  return {
    username: data.username,
    homeCity: data.home_city ?? '',
    explorerStyles: data.explorer_styles,
    explorer: data.explorer ?? undefined,
    isPrivate: data.is_private,
    socials: cleanSocialLinks(data.social_links),
  };
}

/** Stable error codes the settings screen maps to i18n strings. */
export type AccountError = 'username_taken' | 'username_invalid' | 'unknown';

export const USERNAME_RULE = /^[a-zA-Z0-9_.]{3,24}$/;

export type UsernameStatus = 'idle' | 'invalid' | 'checking' | 'available' | 'taken';

/**
 * Is this username free? Asks the server as you type (debounced); the database's unique index
 * still has the last word when you save. The demo can only check its own made-up explorers.
 */
export function useUsernameStatus(name: string, current?: string): UsernameStatus {
  const [debounced, setDebounced] = useState(name);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(name), 350);
    return () => clearTimeout(id);
  }, [name]);
  const valid = USERNAME_RULE.test(name);
  const mine = !!current && name.toLowerCase() === current.toLowerCase();
  const server = useQuery({
    queryKey: ['username-available', debounced.toLowerCase()],
    enabled: !isDemo && valid && !mine && debounced === name,
    queryFn: async () => {
      const { data, error } = await supabase!.rpc('username_available', { p_name: debounced });
      if (error) throw error;
      return data as boolean;
    },
    staleTime: 10_000,
  });
  if (!name) return 'idle';
  if (!valid) return 'invalid';
  if (mine) return 'available';
  if (isDemo)
    return DEMO_USERS.some((u) => u.username.toLowerCase() === name.toLowerCase())
      ? 'taken'
      : 'available';
  if (debounced !== name || server.isFetching || server.data === undefined) return 'checking';
  return server.data ? 'available' : 'taken';
}

/** Change your username and / or social links (server: your own profiles row only). */
export function useUpdateAccount() {
  const update = useSession((s) => s.updateProfile);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: { username?: string; socials?: SocialLinks }) => {
      if (patch.username !== undefined && !USERNAME_RULE.test(patch.username))
        throw new Error('username_invalid');
      const socials = patch.socials && cleanSocialLinks(patch.socials);
      const name = patch.username?.toLowerCase();
      if (isDemo && name && DEMO_USERS.some((u) => u.username.toLowerCase() === name))
        throw new Error('username_taken');
      if (!isDemo) {
        const db = supabase!;
        const me = (await db.auth.getUser()).data.user!.id;
        const row: Record<string, unknown> = {};
        if (patch.username !== undefined) row.username = patch.username;
        if (socials) row.social_links = socials;
        const { error } = await db.from('profiles').update(row).eq('id', me);
        // 23505: unique_violation on profiles.username.
        if (error) throw new Error(error.code === '23505' ? 'username_taken' : 'unknown');
      }
      update({
        ...(patch.username !== undefined ? { username: patch.username } : {}),
        ...(socials ? { socials } : {}),
      });
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const filename = `wandro-data-${new Date().toISOString().slice(0, 10)}.json`;
      if (isDemo) {
        const { teleport: _t, justUnlocked: _j, account, ...state } = useSession.getState();
        // Export the login's email but not its password hash.
        Object.assign(state, { account: account ? { email: account.email } : null });
        const data = Object.fromEntries(
          Object.entries(state).filter(([, v]) => typeof v !== 'function'),
        );
        return saveJson(filename, { exported_at: new Date().toISOString(), mode: 'demo', ...data });
      }
      const { data, error } = await supabase!.rpc('export_my_data');
      if (error) throw error;
      return saveJson(filename, data);
    },
  });
}

export function useDeleteAccount() {
  const reset = useSession((s) => s.reset);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!isDemo) {
        const db = supabase!;
        const me = (await db.auth.getUser()).data.user!.id;
        // Photos live in storage, not the database: remove them first.
        const { data: files } = await db.storage.from('post-photos').list(me);
        if (files?.length)
          await db.storage.from('post-photos').remove(files.map((f) => `${me}/${f.name}`));
        const { error } = await db.rpc('delete_my_account');
        if (error) throw error;
        await db.auth.signOut();
      }
      reset();
      qc.clear();
    },
  });
}

export function useUpdatePrivacy() {
  const update = useSession((s) => s.updateProfile);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (isPrivate: boolean) => {
      update({ isPrivate });
      if (isDemo) return;
      const db = supabase!;
      const me = (await db.auth.getUser()).data.user!.id;
      const { error } = await db.from('profiles').update({ is_private: isPrivate }).eq('id', me);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}
