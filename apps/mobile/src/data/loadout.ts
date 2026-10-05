import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { isBoostActive, isTrailActive, shopItem, TIME_KEY_CODE, trailEndsAt } from '@wandro/shared';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

export interface Loadout {
  skin?: string;
  hat?: string;
  owned: Set<string>;
  trailActive: boolean;
  trailEndsAt: number;
  /** One-use boosts you're holding (stamp ink, friend beacon). */
  held: Set<string>;
  /** Timed boosts' expiry, by item code. */
  activeUntil: Record<string, string>;
  timeKeyActive: boolean;
}

const isConsumable = (code: string) => !!shopItem(code)?.consumable;

interface ServerInventory {
  equipped_skin: string | null;
  equipped_hat: string | null;
  items: { item_code: string; expires_at: string | null }[];
}

/** Your explorer's equipped outfit and hat, and which boosts are running or held (re-checked every 15 s). */
export function useLoadout(): Loadout {
  const inventory = useSession((s) => s.inventory);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);
  const server = useQuery({
    queryKey: ['inventory'],
    enabled: !isDemo,
    queryFn: async () => {
      const { data, error } = await supabase!.rpc('my_inventory');
      if (error) throw error;
      return data as ServerInventory;
    },
  });

  if (!isDemo) {
    const inv = server.data;
    const activeUntil: Record<string, string> = {};
    for (const i of inv?.items ?? []) if (i.expires_at) activeUntil[i.item_code] = i.expires_at;
    const kept = (inv?.items ?? []).filter((i) => !i.expires_at).map((i) => i.item_code);
    return {
      skin: inv?.equipped_skin ?? undefined,
      hat: inv?.equipped_hat ?? undefined,
      owned: new Set(kept.filter((c) => !isConsumable(c))),
      held: new Set(kept.filter(isConsumable)),
      activeUntil,
      trailActive: isTrailActive(activeUntil, now),
      trailEndsAt: trailEndsAt(activeUntil),
      timeKeyActive: isBoostActive(activeUntil, TIME_KEY_CODE, now),
    };
  }
  return {
    skin: inventory.equipped.skin,
    hat: inventory.equipped.hat,
    owned: new Set(Object.keys(inventory.owned).filter((c) => !isConsumable(c))),
    held: new Set(Object.keys(inventory.owned).filter(isConsumable)),
    activeUntil: inventory.activeUntil,
    trailActive: isTrailActive(inventory.activeUntil, now),
    trailEndsAt: trailEndsAt(inventory.activeUntil),
    timeKeyActive: isBoostActive(inventory.activeUntil, TIME_KEY_CODE, now),
  };
}
