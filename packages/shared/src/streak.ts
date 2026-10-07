/**
 * The daily streak, Duolingo style: complete at least one challenge a day (Lisbon calendar) to
 * keep it alive. The server stores the run length and the last day you played
 * (`profiles.streak_days`, `last_active_date`); this works out what to show today.
 */

export interface StreakDay {
  /** YYYY-MM-DD. */
  date: string;
  /** 0 = Monday … 6 = Sunday. */
  weekday: number;
  /** A challenge was completed that day, as part of the current streak. */
  lit: boolean;
  today: boolean;
  future: boolean;
}

export interface StreakView {
  /** Days in a row, counting today if you've played; 0 once a day has been missed. */
  days: number;
  /** You've completed a challenge today, so the streak is safe until tomorrow. */
  doneToday: boolean;
  /** You played yesterday but not yet today: complete a challenge before midnight. */
  atRisk: boolean;
  /** Monday to Sunday of this week. */
  week: StreakDay[];
}

const DAY = 86_400_000;
const toMs = (d: string) => Date.parse(`${d}T00:00:00Z`);
const fromMs = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function addDays(date: string, n: number): string {
  return fromMs(toMs(date) + n * DAY);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((toMs(b) - toMs(a)) / DAY);
}

export function streakView(lastActive: string | null, today: string, stored: number): StreakView {
  const gap = lastActive ? daysBetween(lastActive, today) : Infinity;
  const alive = gap <= 1 && stored > 0;
  const days = alive ? stored : 0;
  const firstLit = alive ? addDays(lastActive!, -(days - 1)) : null;
  // Monday of this week (getUTCDay: 0 = Sunday).
  const dow = (new Date(toMs(today)).getUTCDay() + 6) % 7;
  const monday = addDays(today, -dow);
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    return {
      date,
      weekday: i,
      lit: !!firstLit && date >= firstLit && date <= lastActive!,
      today: date === today,
      future: date > today,
    };
  });
  return { days, doneToday: alive && gap === 0, atRisk: alive && gap === 1, week };
}
