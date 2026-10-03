import { dayRanges, openStatus } from './hours';
import type { OpeningSlot } from './types';

// Thu–Sat 21:30 to 00:30 (runs past midnight).
const lateNights: OpeningSlot[] = [{ days: [4, 5, 6], open: '21:30', close: '00:30' }];
// 2026-10-01 is a Thursday.
const at = (day: number, hh: number, mm = 0) => new Date(2026, 9, day, hh, mm);

describe('openStatus', () => {
  it('returns null for places without set times', () => {
    expect(openStatus(undefined, at(1, 12))).toBeNull();
    expect(openStatus([], at(1, 12))).toBeNull();
  });

  it('is open inside the window and reports the closing time', () => {
    expect(openStatus(lateNights, at(1, 22))).toEqual({ open: true, closes: '00:30' });
  });

  it('stays open past midnight into the next day', () => {
    // Friday 00:15 is still Thursday night's session.
    expect(openStatus(lateNights, at(2, 0, 15))).toEqual({ open: true, closes: '00:30' });
    expect(openStatus(lateNights, at(2, 0, 30))?.open).toBe(false);
  });

  it('wraps Saturday night into Sunday morning', () => {
    // 2026-10-04 is a Sunday.
    expect(openStatus(lateNights, at(4, 0, 10))).toEqual({ open: true, closes: '00:30' });
  });

  it('reports the next opening later today', () => {
    expect(openStatus(lateNights, at(1, 18))).toEqual({
      open: false,
      opensDay: 4,
      opensAt: '21:30',
      inDays: 0,
    });
  });

  it('reports the next opening on a later day', () => {
    // Sunday afternoon -> next Thursday.
    expect(openStatus(lateNights, at(4, 15))).toEqual({
      open: false,
      opensDay: 4,
      opensAt: '21:30',
      inDays: 4,
    });
  });
});

describe('dayRanges', () => {
  it('collapses consecutive days, Monday first', () => {
    expect(dayRanges([6, 4, 5])).toEqual([[4, 6]]);
    expect(dayRanges([1, 2, 3, 5])).toEqual([
      [1, 3],
      [5, 5],
    ]);
    expect(dayRanges([0, 1, 2, 3, 4, 5, 6])).toEqual([[1, 0]]);
  });
});
