import { useQuery } from '@tanstack/react-query';
import { BADGES, type BadgeDef } from '@wandro/shared';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

export interface EarnedBadge extends BadgeDef {
  awardedAt: string | null;
}

/** All badges with the date each was earned (null = not yet). */
export function useBadges(userId?: string): EarnedBadge[] {
  const demo = useSession((s) => s.badges);
  const server = useQuery({
    queryKey: ['badges', userId ?? 'me'],
    enabled: !isDemo,
    queryFn: async () => {
      const db = supabase!;
      const uid = userId ?? (await db.auth.getUser()).data.user?.id;
      const { data, error } = await db
        .from('user_badges')
        .select('awarded_at, badges(code)')
        .eq('user_id', uid!);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data as unknown as { awarded_at: string; badges: { code: string } }[]) {
        map[row.badges.code] = row.awarded_at;
      }
      return map;
    },
  });
  const earned = isDemo ? demo : (server.data ?? {});
  return BADGES.map((b) => ({ ...b, awardedAt: earned[b.code] ?? null }));
}
