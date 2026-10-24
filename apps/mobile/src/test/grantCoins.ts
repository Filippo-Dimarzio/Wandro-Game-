import { useSession } from '@/state/session';

/**
 * Tops up the demo wallet for tests that shop: a completed challenge pays at most 50 coins
 * (ACTIVITY_COIN_CAP), so earning a store's prices by playing would take dozens of check-ins.
 */
export function grantCoins(coins: number) {
  useSession.setState((s) => ({
    ledger: [...s.ledger, { kind: 'moderation', coins, xp: 0, at: new Date().toISOString() }],
  }));
}
