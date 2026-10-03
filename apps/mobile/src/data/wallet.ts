import { useQuery } from '@tanstack/react-query';
import { walletOf } from '@/demo/engine';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

export interface Wallet {
  coins: number;
  coinsEarned: number;
  xp: number;
  level: number;
  streak: number;
  discoveries: number;
}

const EMPTY: Wallet = { coins: 0, coinsEarned: 0, xp: 0, level: 1, streak: 0, discoveries: 0 };

/** Coins, XP, level and streak. The server's ledger is the source of truth; demo mirrors it. */
export function useWallet(): Wallet {
  const ledger = useSession((s) => s.ledger);
  const unlocked = useSession((s) => s.unlocked);
  const streak = useSession((s) => s.streak);
  const server = useQuery({
    queryKey: ['wallet'],
    enabled: !isDemo,
    queryFn: async (): Promise<Wallet> => {
      const { data, error } = await supabase!.rpc('my_wallet');
      if (error) throw error;
      const w = data as Record<string, number>;
      return {
        coins: w.coins,
        coinsEarned: w.coins_earned,
        xp: w.xp,
        level: w.level,
        streak: w.streak,
        discoveries: w.discoveries,
      };
    },
  });
  if (!isDemo) return server.data ?? EMPTY;
  return walletOf({
    unlocked,
    ledger,
    streak,
    lastActiveDate: null,
    badges: {},
    challengesCompleted: 0,
    collectionsClaimed: {},
  });
}
