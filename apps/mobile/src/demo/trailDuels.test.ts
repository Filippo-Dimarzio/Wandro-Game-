import { TRAIL_DUELS_PER_DAY } from '@wandro/shared';
import {
  friendScoreFor,
  initialTrailDuels,
  sendTrailDuel,
  settleTrailDuels,
  trailDuelError,
} from './trailDuels';

const now = new Date('2026-10-25T10:00:00Z');
const slug = 'sintra-magpies-millionaire';

describe('demo trail duels (mirrors the server)', () => {
  it('needs a friend and a trail you have unlocked, and is rate limited', () => {
    const ok = {
      friendStatus: 'friends' as const,
      trailExists: true,
      trailStarted: true,
      sentToday: 0,
    };
    expect(trailDuelError(ok)).toBeNull();
    expect(trailDuelError({ ...ok, friendStatus: 'outgoing' })).toBe('not_friends');
    expect(trailDuelError({ ...ok, trailStarted: false })).toBe('not_started');
    expect(trailDuelError({ ...ok, trailExists: false })).toBe('unknown_trail');
    expect(trailDuelError({ ...ok, sentToday: TRAIL_DUELS_PER_DAY })).toBe('rate_limited');
  });

  it('one open duel per friend and trail; scripted friends accept at once', () => {
    const a = sendTrailDuel([], 'demo-user-ines', slug, now);
    expect(a.duels[0]).toMatchObject({ status: 'accepted', direction: 'outgoing' });
    expect(sendTrailDuel(a.duels, 'demo-user-ines', slug, now)).toEqual(a);
  });

  it('settles once you finish: 25, plus 25 for the better score (ties win)', () => {
    const { duels } = sendTrailDuel([], 'demo-user-ines', slug, now);
    const friend = friendScoreFor(slug);
    expect(settleTrailDuels(duels, slug, null, now).ledger).toEqual([]);
    const win = settleTrailDuels(duels, slug, friend, now);
    expect(win.ledger.map((e) => [e.kind, e.coins])).toEqual([['trail_duel', 50]]);
    expect(win.duels[0]).toMatchObject({ status: 'done', myScore: friend });
    const lose = settleTrailDuels(duels, slug, friend - 5, now);
    expect(lose.ledger[0]!.coins).toBe(25);
    // A settled duel pays once.
    expect(settleTrailDuels(win.duels, slug, friend, now).ledger).toEqual([]);
  });

  it('a pending duel from a friend waits for your answer', () => {
    const [d] = initialTrailDuels(now);
    expect(d).toMatchObject({ direction: 'incoming', status: 'pending' });
    expect(settleTrailDuels([d!], d!.trail, 100, now).ledger).toEqual([]);
  });
});
