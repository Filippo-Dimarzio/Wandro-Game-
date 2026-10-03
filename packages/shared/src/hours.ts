import type { OpeningSlot, Weekday } from './types';

const DAY = 24 * 60;
const WEEK = 7 * DAY;

export type OpenStatus =
  | { open: true; closes: string }
  | { open: false; opensDay: Weekday; opensAt: string; inDays: number };

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Whether a place with set times is open at `now` (device local time), and if not,
 * when it next opens. Returns null for places without times or with no open days.
 */
export function openStatus(hours: OpeningSlot[] | undefined, now: Date): OpenStatus | null {
  if (!hours?.length) return null;
  const nowM = now.getDay() * DAY + now.getHours() * 60 + now.getMinutes();
  let next: { wait: number; day: Weekday; at: string } | null = null;

  for (const slot of hours) {
    const open = minutes(slot.open);
    const close = minutes(slot.close);
    const length = close > open ? close - open : close + DAY - open;
    for (const day of slot.days) {
      const start = day * DAY + open;
      // Check this week's window and last week's (for windows that wrap past Saturday night).
      for (const s of [start, start - WEEK]) {
        if (nowM >= s && nowM < s + length) return { open: true, closes: slot.close };
      }
      const wait = (start - nowM + WEEK) % WEEK;
      if (!next || wait < next.wait) next = { wait, day, at: slot.open };
    }
  }
  if (!next) return null;
  const inDays = Math.floor((now.getHours() * 60 + now.getMinutes() + next.wait) / DAY);
  return { open: false, opensDay: next.day, opensAt: next.at, inDays };
}

/** Collapse days into compact ranges for display, e.g. [4,5,6] -> [[4,6]]. Sunday sorts last. */
export function dayRanges(days: Weekday[]): [Weekday, Weekday][] {
  const order = [...new Set(days)].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  const ranges: [Weekday, Weekday][] = [];
  for (const d of order) {
    const last = ranges[ranges.length - 1];
    if (last && (last[1] + 1) % 7 === d && last[1] !== 0) last[1] = d;
    else ranges.push([d, d]);
  }
  return ranges;
}
