import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DEMO_PLACES,
  shopItem,
  unlockProgress,
  type Category,
  type UnlockStats,
} from '@wandro/shared';
import { useCities } from '@/data/cities';
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
        if (
          (item.kind !== 'boost' || item.consumable) &&
          useSession.getState().inventory.owned[code]
        )
          throw new Error('already_owned');
        if (!unlockProgress(item, demoUnlockStats())?.met && item.unlock)
          throw new Error('challenge_not_done');
        if (!buy(code, item.price, item.durationMinutes)) throw new Error('insufficient_coins');
        return;
      }
      const { error } = await supabase!.rpc('buy_item', { p_code: code });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['unlock-stats'] });
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

/** Places discovered per category, from the demo's unlocked places. */
function demoCategoryCounts(unlocked: Record<string, unknown>): Partial<Record<Category, number>> {
  const counts: Partial<Record<Category, number>> = {};
  for (const id of Object.keys(unlocked)) {
    const cat = DEMO_PLACES.find((p) => p.id === id)?.category;
    if (cat) counts[cat] = (counts[cat] ?? 0) + 1;
  }
  return counts;
}

function demoUnlockStats(): UnlockStats {
  const s = useSession.getState();
  const cities = new Set(
    Object.keys(s.unlocked)
      .map((id) => DEMO_PLACES.find((p) => p.id === id)?.region)
      .filter(Boolean),
  );
  for (const city of Object.keys(s.stamps)) cities.add(city);
  return { categoryCounts: demoCategoryCounts(s.unlocked), cityStamps: cities.size };
}

/** What you've done towards store unlocks: places per category and city stamps collected. */
export function useUnlockStats(): UnlockStats {
  const unlocked = useSession((s) => s.unlocked);
  const cities = useCities();
  const server = useQuery({
    queryKey: ['unlock-stats'],
    enabled: !isDemo,
    queryFn: async () => {
      const { data, error } = await supabase!.from('visits').select('places(category)');
      if (error) throw error;
      const counts: Partial<Record<Category, number>> = {};
      for (const row of data as unknown as { places: { category: Category } | null }[]) {
        const cat = row.places?.category;
        if (cat) counts[cat] = (counts[cat] ?? 0) + 1;
      }
      return counts;
    },
  });
  const cityStamps = cities.filter((c) => c.unlocked).length;
  if (!isDemo) return { categoryCounts: server.data ?? {}, cityStamps };
  return { categoryCounts: demoCategoryCounts(unlocked), cityStamps };
}
