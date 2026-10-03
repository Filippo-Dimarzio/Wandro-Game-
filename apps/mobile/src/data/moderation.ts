import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Category } from '@wandro/shared';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

export interface NewSubmission {
  name: string;
  description: string;
  category: Category;
  lat: number;
  lng: number;
  isPublicAccess: boolean;
  isSafe: boolean;
}

export function useSubmitPlace() {
  const qc = useQueryClient();
  const add = useSession((s) => s.addSubmission);
  return useMutation({
    mutationFn: async (s: NewSubmission) => {
      if (!s.isPublicAccess || !s.isSafe) throw new Error('unsafe');
      if (isDemo) {
        add({
          id: `sub-${Date.now()}`,
          name: s.name,
          description: s.description,
          category: s.category,
          lat: s.lat,
          lng: s.lng,
          status: 'pending',
          at: new Date().toISOString(),
        });
        return;
      }
      const db = supabase!;
      const me = (await db.auth.getUser()).data.user!.id;
      const { error } = await db.from('place_submissions').insert({
        user_id: me,
        name: s.name,
        description: s.description || null,
        category: s.category,
        location: `SRID=4326;POINT(${s.lng} ${s.lat})`,
        is_public_access: s.isPublicAccess,
        is_safe: s.isSafe,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['moderation'] }),
  });
}

export interface ModerationQueue {
  submissions: {
    id: string;
    name: string;
    description: string | null;
    category: Category;
    lat: number;
    lng: number;
    username: string;
  }[];
  reports: { id: string; targetType: string; targetId: string; reason: string }[];
  flagged: { id: string; username: string; place: string; reason: string }[];
}

export function useIsModerator(): boolean {
  const demoModerator = useSession((s) => s.demoModerator);
  const server = useQuery({
    queryKey: ['is-moderator'],
    enabled: !isDemo,
    queryFn: async () => {
      const db = supabase!;
      const me = (await db.auth.getUser()).data.user?.id;
      const { data } = await db.from('profiles').select('is_moderator').eq('id', me!).single();
      return !!data?.is_moderator;
    },
  });
  return isDemo ? demoModerator : !!server.data;
}

export function useModerationQueue() {
  const s = useSession();
  const server = useQuery({
    queryKey: ['moderation'],
    enabled: !isDemo,
    queryFn: async (): Promise<ModerationQueue> => {
      const { data, error } = await supabase!.rpc('moderation_queue');
      if (error) throw error;
      const d = data as {
        submissions: ModerationQueue['submissions'];
        reports: { id: string; target_type: string; target_id: string; reason: string }[];
        flagged_checkins: ModerationQueue['flagged'];
      };
      return {
        submissions: d.submissions,
        reports: d.reports.map((r) => ({
          id: r.id,
          targetType: r.target_type,
          targetId: r.target_id,
          reason: r.reason,
        })),
        flagged: d.flagged_checkins,
      };
    },
  });
  if (!isDemo) return { data: server.data, isLoading: server.isLoading, error: server.error };
  return {
    data: {
      submissions: s.submissions
        .filter((x) => x.status === 'pending')
        .map((x) => ({
          id: x.id,
          name: x.name,
          description: x.description,
          category: x.category,
          lat: x.lat,
          lng: x.lng,
          username: s.profile?.username ?? 'you',
        })),
      reports: s.reports.map((r, i) => ({
        id: `rep-${i}`,
        targetType: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
      })),
      flagged: [],
    } satisfies ModerationQueue,
    isLoading: false,
    error: null,
  };
}

export function useModerationActions() {
  const qc = useQueryClient();
  const review = useSession((s) => s.reviewSubmission);
  const done = () => qc.invalidateQueries();
  const db = () => supabase!;
  return {
    reviewSubmission: useMutation({
      mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
        if (isDemo) return review(id, approve);
        const { error } = approve
          ? await db().rpc('approve_place_submission', { p_submission_id: id })
          : await db().rpc('reject_place_submission', {
              p_submission_id: id,
              p_reason: 'Does not meet the guidelines',
            });
        if (error) throw error;
      },
      onSuccess: done,
    }),
    resolveReport: useMutation({
      mutationFn: async ({ id, remove }: { id: string; remove: boolean }) => {
        if (isDemo) return;
        const { error } = await db().rpc('resolve_report', {
          p_report_id: id,
          p_remove_content: remove,
        });
        if (error) throw error;
      },
      onSuccess: done,
    }),
    reviewFlagged: useMutation({
      mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
        if (isDemo) return;
        const { error } = await db().rpc('review_flagged_checkin', {
          p_session_id: id,
          p_approve: approve,
        });
        if (error) throw error;
      },
      onSuccess: done,
    }),
  };
}
