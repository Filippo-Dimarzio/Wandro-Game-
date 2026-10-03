import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isDemo } from '@/lib/env';
import { saveJson } from '@/lib/download';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

export function useExportData() {
  return useMutation({
    mutationFn: async () => {
      const filename = `wandro-data-${new Date().toISOString().slice(0, 10)}.json`;
      if (isDemo) {
        const { teleport: _t, justUnlocked: _j, ...state } = useSession.getState();
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
