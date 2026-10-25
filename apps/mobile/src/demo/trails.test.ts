import { ledgerXp, TRAILS } from '@wandro/shared';
import {
  answerTrailClue,
  startTrail,
  takeTrailHint,
  TrailFailure,
  type DemoTrails,
} from './trails';

const now = new Date('2026-10-25T10:00:00Z');
const trail = TRAILS.find((t) => t.slug === 'sintra-magpies-millionaire')!;
const all = () => true;

const failsWith = (fn: () => unknown, code: string) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(TrailFailure);
    expect((e as TrailFailure).code).toBe(code);
    return;
  }
  throw new Error(`expected ${code}`);
};

describe('demo trails (mirrors the server)', () => {
  it('needs a start, a discovered place and the stops in order', () => {
    failsWith(() => answerTrailClue({}, trail.slug, 1, '3', all, now), 'not_started');
    const t = startTrail({}, trail.slug, now);
    expect(startTrail(t, trail.slug, now)).toBe(t);
    failsWith(() => answerTrailClue(t, trail.slug, 1, '3', () => false, now), 'not_discovered');
    failsWith(() => answerTrailClue(t, trail.slug, 2, 'Por bem', all, now), 'not_current');
    failsWith(() => startTrail({}, 'nowhere', now), 'unknown_trail');
  });

  it('hints and wrong answers cost 5 each, solved stops pay once, the finish pays 50', () => {
    let t: DemoTrails = startTrail({}, trail.slug, now);
    const h = takeTrailHint(t, trail.slug, 1);
    expect(h.hint).toBe(trail.stops[0]!.hints[0]);
    t = h.trails;
    let r = answerTrailClue(t, trail.slug, 1, '4', all, now);
    expect(r.result.correct).toBe(false);
    t = r.trails;
    r = answerTrailClue(t, trail.slug, 1, ' 3 ', all, now);
    expect(r.result).toEqual({ correct: true, coins: 10, completed: false, bonus: 0 });
    t = r.trails;
    failsWith(() => answerTrailClue(t, trail.slug, 1, '3', all, now), 'already_solved');

    for (const [i, s] of trail.stops.entries()) {
      if (i === 0) continue;
      r = answerTrailClue(t, trail.slug, i + 1, s.clue.answer, all, now);
      t = r.trails;
    }
    expect(r.result).toEqual({ correct: true, coins: 20, completed: true, bonus: 50 });
    expect(r.ledger.map((e) => [e.kind, e.coins])).toEqual([
      ['trail_stop', 20],
      ['trail', 50],
    ]);
    expect(ledgerXp('trail')).toBe(50);
    expect(ledgerXp('trail_stop')).toBe(0);
    expect(t[trail.slug]!.completedAt).toBe(now.toISOString());
  });

  it('three hints per stop', () => {
    let t = startTrail({}, trail.slug, now);
    for (let i = 0; i < 3; i++) t = takeTrailHint(t, trail.slug, 1).trails;
    failsWith(() => takeTrailHint(t, trail.slug, 1), 'no_more_hints');
    const r = answerTrailClue(t, trail.slug, 1, '3', all, now);
    expect(r.result.coins).toBe(5);
  });
});
