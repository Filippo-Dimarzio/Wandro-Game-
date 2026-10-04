import { BEACON_BONUS, DEMO_PLACES, TIME_QUEST_BONUS } from '@wandro/shared';
import { useSession } from '@/state/session';
import { applyVisit, EMPTY_PROGRESS, walletOf } from './engine';

const byId = (id: string) => DEMO_PLACES.find((p) => p.id === id)!;
// 23:30 in Lisbon on a July night: night quests are open, golden hour is over.
const NIGHT = new Date('2026-07-15T22:30:00Z');
const buy = (code: string, price: number, mins?: number) =>
  expect(useSession.getState().buy(code, price, mins)).toBe(true);

describe('time-of-day key (demo engine)', () => {
  const temple = byId('demo-evora-roman-temple'); // night quest

  it('pays the time quest bonus in its window with the key', () => {
    const r = applyVisit(EMPTY_PROGRESS, temple, DEMO_PLACES, NIGHT, { timeKey: true })!;
    const plain = applyVisit(EMPTY_PROGRESS, temple, DEMO_PLACES, NIGHT)!;
    expect(r.result.timeQuestBonus).toBe(TIME_QUEST_BONUS);
    expect(r.result.coins - plain.result.coins).toBe(TIME_QUEST_BONUS);
    expect(walletOf(r.progress).coins - walletOf(plain.progress).coins).toBe(TIME_QUEST_BONUS);
  });

  it('pays nothing outside the window or at places without a quest', () => {
    const noon = new Date('2026-07-15T11:00:00Z');
    expect(
      applyVisit(EMPTY_PROGRESS, temple, DEMO_PLACES, noon, { timeKey: true })!.result
        .timeQuestBonus,
    ).toBe(0);
    expect(
      applyVisit(EMPTY_PROGRESS, byId('demo-pena'), DEMO_PLACES, NIGHT, { timeKey: true })!.result
        .timeQuestBonus,
    ).toBe(0);
  });
});

describe('boosts in the demo session', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NIGHT, doNotFake: ['nextTick', 'setImmediate'] });
    useSession.getState().reset();
    const s = useSession.getState();
    s.recordVisit(byId('demo-music'), DEMO_PLACES); // 570 coins
    s.recordVisit(byId('demo-pena'), DEMO_PLACES);
  });
  afterEach(() => jest.useRealTimers());

  it('the key opens night quests', () => {
    buy('time_key', 200, 1440);
    const r = useSession.getState().recordVisit(byId('demo-evora-roman-temple'), DEMO_PLACES)!;
    expect(r.timeQuestBonus).toBe(TIME_QUEST_BONUS);
  });

  it('stamp ink makes the next new city gold, once', () => {
    buy('stamp_ink', 250);
    expect(useSession.getState().stamps.sintra.gold).toBe(false); // collected before the ink
    // Another Sintra place doesn't use the ink: Sintra is already collected.
    expect(
      useSession.getState().recordVisit(byId('demo-mouros'), DEMO_PLACES)!.stamp,
    ).toBeUndefined();
    const evora = useSession.getState().recordVisit(byId('demo-evora-roman-temple'), DEMO_PLACES)!;
    expect(evora.stamp).toEqual({ region: 'evora', gold: true });
    expect(useSession.getState().inventory.owned.stamp_ink).toBeUndefined();
    const porto = useSession.getState().recordVisit(byId('demo-porto-ribeira'), DEMO_PLACES)!;
    expect(porto.stamp).toEqual({ region: 'porto', gold: false });
  });

  it('a beacon lit today pays when you finish the challenge', () => {
    const s = useSession.getState();
    expect(s.lightBeacon('demo-fc-1')).toBe('no_beacon');
    buy('friend_beacon', 150);
    expect(useSession.getState().lightBeacon('demo-fc-1')).toBeNull();
    expect(useSession.getState().inventory.owned.friend_beacon).toBeUndefined();
    expect(useSession.getState().lightBeacon('demo-fc-1')).toBe('challenge_not_found');
    const r = useSession.getState().recordVisit(byId('demo-regaleira'), DEMO_PLACES)!;
    expect(r.beaconBonus).toBe(BEACON_BONUS);
  });

  it('a beacon from another day pays nothing', () => {
    buy('friend_beacon', 150);
    useSession.getState().lightBeacon('demo-fc-1');
    jest.setSystemTime(new Date(NIGHT.getTime() + 86_400_000));
    const r = useSession.getState().recordVisit(byId('demo-regaleira'), DEMO_PLACES)!;
    expect(r.beaconBonus).toBe(0);
  });
});
