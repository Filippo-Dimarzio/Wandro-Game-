import { addDays, streakView } from './streak';

// 2026-10-07 is a Wednesday.
const today = '2026-10-07';

describe('streakView', () => {
  it('counts a streak you kept today, and lights its days this week', () => {
    const v = streakView(today, today, 3);
    expect(v).toMatchObject({ days: 3, doneToday: true, atRisk: false });
    expect(v.week.map((d) => d.lit)).toEqual([true, true, true, false, false, false, false]);
    expect(v.week[2]).toMatchObject({ date: today, today: true, future: false });
    expect(v.week[3]!.future).toBe(true);
  });

  it('keeps yesterday’s streak alive but at risk until you complete a challenge today', () => {
    const v = streakView(addDays(today, -1), today, 5);
    expect(v).toMatchObject({ days: 5, doneToday: false, atRisk: true });
    expect(v.week.map((d) => d.lit)).toEqual([true, true, false, false, false, false, false]);
  });

  it('drops to zero after a missed day, like Duolingo', () => {
    expect(streakView(addDays(today, -2), today, 9)).toMatchObject({
      days: 0,
      doneToday: false,
      atRisk: false,
    });
    expect(streakView(addDays(today, -2), today, 9).week.some((d) => d.lit)).toBe(false);
  });

  it('starts at zero for a new player', () => {
    expect(streakView(null, today, 0)).toMatchObject({ days: 0, doneToday: false, atRisk: false });
  });

  it('runs the week from Monday to Sunday', () => {
    const v = streakView(null, '2026-10-11', 0); // a Sunday
    expect(v.week[0]!.date).toBe('2026-10-05');
    expect(v.week[6]).toMatchObject({ date: '2026-10-11', today: true });
  });
});
