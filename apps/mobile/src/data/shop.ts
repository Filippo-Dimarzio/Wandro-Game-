import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shopItem } from '@wandro/shared';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

export function useBuyItem() {
  const qc = useQueryClient();
  const buy = useSession((s) => s.buy);
  return useMutation({
    mutationFn: async (code: string) => {
      const item = shopItem(code);
      if (!item) throw new Error('item_not_found');
      if (isDemo) {
        if (item.kind !== 'boost' && useSession.getState().inventory.owned[code])
          throw new Error('already_owned');
        if (!buy(code, item.price, item.durationMinutes)) throw new Error('insufficient_coins');
        return;
      }
      const { error } = await supabase!.rpc('buy_item', { p_code: code });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useEquipItem() {
  const qc = useQueryClient();
  const equip = useSession((s) => s.equip);
  return useMutation({
    mutationFn: async ({ slot, code }: { slot: 'skin' | 'hat'; code: string | undefined }) => {
      if (isDemo) return equip(slot, code);
      const { error } = await supabase!.rpc('equip_item', { p_slot: slot, p_code: code ?? null });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });
}
