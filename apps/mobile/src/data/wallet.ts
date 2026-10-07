import { useQuery } from '@tanstack/react-query';
import { streakView, type StreakView } from '@wandro/shared';
import { lisbonDate, walletOf } from '@/demo/engine';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

export interface Wallet {
  coins: number;
  coinsEarned: number;
  xp: number;
  level: number;
  /** Days in a row with a completed challenge, as it stands today (0 once a day is missed). */
  streak: number;
  /** The last day (Lisbon calendar) a challenge was completed. */
  lastActiveDate: string | null;
  discoveries: number;
}

const EMPTY: Wallet = {
  coins: 0,
  coinsEarned: 0,
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: null,
  discoveries: 0,
};

/** Coins, XP, level and streak. The server's ledger is the source of truth; demo mirrors it. */
export function useWallet(): Wallet {
  const ledger = useSession((s) => s.ledger);
  const unlocked = useSession((s) => s.unlocked);
  const streak = useSession((s) => s.streak);
  const lastActiveDate = useSession((s) => s.lastActiveDate);
  const server = useQuery({
    queryKey: ['wallet'],
    enabled: !isDemo,
    queryFn: async (): Promise<Wallet> => {
      const { data, error } = await supabase!.rpc('my_wallet');
      if (error) throw error;
      const w = data as Record<string, number> & { last_active_date: string | null };
      return {
        coins: w.coins,
        coinsEarned: w.coins_earned,
        xp: w.xp,
        level: w.level,
        streak: w.streak,
        lastActiveDate: w.last_active_date,
        discoveries: w.discoveries,
      };
    },
  });
  if (!isDemo) return server.data ?? EMPTY;
  const w = walletOf({
    unlocked,
    ledger,
    streak,
    lastActiveDate,
    badges: {},
    challengesCompleted: 0,
    collectionsClaimed: {},
  });
  // Like the server's my_wallet(): a missed day shows as no streak.
  const live = streakView(lastActiveDate, lisbonDate(new Date()), streak).days;
  return { ...w, streak: live, lastActiveDate };
}

/** Today's streak: days in a row, this week's flames, and whether today is done or at risk. */
export function useStreak(): StreakView {
  const w = useWallet();
  return streakView(w.lastActiveDate, lisbonDate(new Date()), w.streak);
}
