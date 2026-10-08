/**
 * Rules for the shop boosts beyond the incense trail. The server is the authority (award_visit,
 * light_beacon in supabase/migrations/20261013090000_boosts.sql); demo mode mirrors these.
 */

export type TimeQuest = 'golden' | 'night';

/** Extra coins for discovering a time quest place in its window while holding the key. */
export const TIME_QUEST_BONUS = 40;
/** Coins each for you and your friend when a beaconed challenge is done the same day. */
export const BEACON_BONUS = 50;

export const TIME_KEY_CODE = 'time_key';
export const STAMP_INK_CODE = 'stamp_ink';
export const FRIEND_BEACON_CODE = 'friend_beacon';

/**
 * Places with a golden-hour or night quest, by seed source id (the demo id without `demo-`).
 * Only open, public, lit spots for night: no closed sites or dark trails.
 * The migrations set places.time_quest from the same list (a test compares them).
 */
export const TIME_QUESTS: Record<string, TimeQuest> = {
  adraga: 'golden',
  'cruz-alta': 'golden',
  'sintra-national-palace': 'night',
  'lisbon-senhora-do-monte': 'golden',
  'lisbon-fado-alfama': 'night',
  'porto-serra-pilar': 'golden',
  'porto-dom-luis': 'night',
  'evora-alto-sao-bento': 'golden',
  'evora-roman-temple': 'night',
  'aveiro-costa-nova': 'golden',
  'aveiro-canal-piramides': 'night',
  // Added in 20261028090000_more_time_quests.
  'lisbon-belem-tower': 'golden',
  'lisbon-santa-justa': 'night',
  'porto-foz': 'golden',
  'porto-ribeira': 'night',
  'evora-giraldo-fountain': 'night',
};

export function timeQuestFor(placeId: string): TimeQuest | undefined {
  return TIME_QUESTS[placeId.replace(/^demo-/, '')];
}

/**
 * Approximate sunset in Lisbon, local time, mid-month (minutes after midnight, Jan..Dec).
 * Close enough for all five cities; the windows below are wide. Mirrored in time_quest_open().
 */
export const SUNSET_MINUTES = [
  1055, 1090, 1120, 1210, 1240, 1265, 1265, 1240, 1195, 1145, 1040, 1035,
];
/** Golden hour: from an hour before sunset to 20 minutes after. */
export const GOLDEN_BEFORE_MIN = 60;
export const GOLDEN_AFTER_MIN = 20;
/** Night: from an hour after sunset until 05:00. */
export const NIGHT_AFTER_SUNSET_MIN = 60;
export const NIGHT_ENDS_MIN = 5 * 60;

function lisbonClock(d: Date): { month: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Lisbon',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { month: get('month'), minutes: get('hour') * 60 + get('minute') };
}

/** Start and end of today's window, in minutes after Lisbon midnight (night wraps past 24:00). */
export function timeQuestWindow(kind: TimeQuest, at: Date): { start: number; end: number } {
  const sunset = SUNSET_MINUTES[lisbonClock(at).month - 1];
  return kind === 'golden'
    ? { start: sunset - GOLDEN_BEFORE_MIN, end: sunset + GOLDEN_AFTER_MIN }
    : { start: sunset + NIGHT_AFTER_SUNSET_MIN, end: 24 * 60 + NIGHT_ENDS_MIN };
}

export function timeQuestOpen(kind: TimeQuest, at: Date): boolean {
  const { minutes } = lisbonClock(at);
  const { start, end } = timeQuestWindow(kind, at);
  if (kind === 'night') return minutes >= start || minutes < NIGHT_ENDS_MIN;
  return minutes >= start && minutes < end;
}

/** "19:55" from minutes after midnight (wrapping past 24:00). */
export function clockLabel(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
