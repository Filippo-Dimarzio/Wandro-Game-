import { DEMO_PLACES } from '@wandro/shared';
import {
  applyDailyChallenge,
  applyPurchase,
  applyVisit,
  EMPTY_PROGRESS,
  lisbonDate,
  walletOf,
} from './engine';

const byId = (id: string) => DEMO_PLACES.find((p) => p.id === id)!;
const now = new Date('2026-10-04T10:00:00Z');

describe('demo engine', () => {
  it('awards coins, pioneer bonus, streak and badges like the server', () => {
    const music = byId('demo-music'); // 0 visitors: first discoverer
    const r = applyVisit(EMPTY_PROGRESS, music, DEMO_PLACES, now)!;
    // base x 5 rarity + 50 pioneer + 20 for a place from a set (Hidden gems)
    expect(r.result.coins).toBe(100 * 5 + 50 + 20);
    expect(r.result.firstDiscovererBonus).toBe(50);
    expect(r.result.setCoins).toBe(20);
    expect(r.result.newBadges).toEqual(['first_step', 'hidden_gem', 'first_discoverer']);
    const w = walletOf(r.progress);
    expect(w.coins).toBe(570);
    // XP is separate from coins: one discovery = one challenge = 50 XP.
    expect(w.xp).toBe(50);
    expect(w.streak).toBe(1);
  });

  it('never pays twice for the same place', () => {
    const r = applyVisit(EMPTY_PROGRESS, byId('demo-pena'), DEMO_PLACES, now)!;
    expect(applyVisit(r.progress, byId('demo-pena'), DEMO_PLACES, now)).toBeNull();
  });

  it('continues the streak on consecutive Lisbon days only', () => {
    const d1 = applyVisit(EMPTY_PROGRESS, byId('demo-pena'), DEMO_PLACES, now)!.progress;
    const d2 = applyVisit(d1, byId('demo-mouros'), DEMO_PLACES, new Date('2026-10-05T10:00:00Z'))!;
    expect(d2.result.streak).toBe(2);
    const d4 = applyVisit(
      d2.progress,
      byId('demo-cabo'),
      DEMO_PLACES,
      new Date('2026-10-07T10:00:00Z'),
    )!;
    expect(d4.result.streak).toBe(1);
  });

  it('pays a collection bonus once when every place is discovered', () => {
    let p = applyVisit(EMPTY_PROGRESS, byId('demo-cabo'), DEMO_PLACES, now)!.progress;
    const r = applyVisit(p, byId('demo-adraga'), DEMO_PLACES, now)!;
    expect(r.result.collectionsCompleted).toEqual(['demo-col-coast']);
    p = r.progress;
    // 20 per place from the set, 50 for finishing it, paid once.
    expect(p.ledger.filter((e) => e.kind === 'collection').map((e) => e.coins)).toEqual([
      20, 20, 50,
    ]);
    expect(r.result.setCoins).toBe(70);
    expect(r.result.coins).toBe(r.progress.unlocked['demo-adraga'].points + 70);
  });

  it('doubles the coins of the qualifying discovery for the daily challenge', () => {
    const v = applyVisit(EMPTY_PROGRESS, byId('demo-adraga'), DEMO_PLACES, now)!;
    const visitCoins = v.progress.unlocked['demo-adraga'].points;
    const d = applyDailyChallenge(v.progress, ['demo-adraga'], 'demo-2026-10-04', DEMO_PLACES, now);
    expect(d.bonus).toBe(visitCoins);
    expect(d.newBadges).toContain('challenger');
  });

  it('spends coins without lowering XP, and refuses when broke', () => {
    const v = applyVisit(EMPTY_PROGRESS, byId('demo-pena'), DEMO_PLACES, now)!.progress;
    const before = walletOf(v);
    const after = applyPurchase(v, 'incense', 100, now)!;
    expect(walletOf(after).coins).toBe(before.coins - 100);
    expect(walletOf(after).xp).toBe(before.xp);
    expect(applyPurchase(EMPTY_PROGRESS, 'incense', 100, now)).toBeNull();
  });

  it('uses the Lisbon calendar day', () => {
    expect(lisbonDate(new Date('2026-10-04T23:30:00Z'))).toBe('2026-10-05');
  });
});
