import { DEMO_PLACES } from '@wandro/shared';
import { hoursStatus, scheduleLines } from './hours';

const corner = DEMO_PLACES.find((p) => p.id === 'demo-music')!;
const pena = DEMO_PLACES.find((p) => p.id === 'demo-pena')!;
// 2026-10-01 is a Thursday.
const at = (day: number, hh: number, mm = 0) => new Date(2026, 9, day, hh, mm);

describe('hours labels', () => {
  it('shows the music corner schedule', () => {
    expect(scheduleLines(corner.hours)).toEqual(['Thu–Sat · 21:30–00:30']);
  });

  it('says when a venue is open or opens next', () => {
    expect(hoursStatus(corner, at(1, 22))).toEqual({
      open: true,
      label: 'Open now · until 00:30',
    });
    expect(hoursStatus(corner, at(1, 12))?.label).toBe('Opens today at 21:30');
    expect(hoursStatus(corner, at(7, 12))?.label).toBe('Opens tomorrow at 21:30');
    expect(hoursStatus(corner, at(4, 12))?.label).toBe('Opens Thu at 21:30');
  });

  it('has nothing to say about places without set times', () => {
    expect(hoursStatus(pena)).toBeNull();
    expect(scheduleLines(pena.hours)).toEqual([]);
  });
});
