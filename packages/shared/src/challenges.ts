import type { Category } from './types';

/**
 * The daily challenge calendar. Demo mode reads it directly; the server gets the same rotation
 * and dated challenges from migration SQL generated here (catalog-sync.test.ts keeps them equal).
 */
export interface ChallengeDef {
  title: string;
  description: string;
  /** null: any place counts. */
  category: Category | null;
}

/** A challenge pinned to a date or a date range (inclusive, Lisbon dates). */
export interface DatedChallenge extends ChallengeDef {
  campaign: string;
  startsOn: string;
  endsOn: string;
}

/** Every category appears in the rotation; it repeats every CHALLENGE_ROTATION.length days. */
export const CHALLENGE_ROTATION: readonly ChallengeDef[] = [
  {
    title: 'Find a hidden viewpoint',
    description: 'Discover any nature spot today.',
    category: 'nature',
  },
  {
    title: 'Step into history',
    description: 'Discover any heritage site today.',
    category: 'heritage',
  },
  {
    title: 'Catch the music',
    description: 'Discover a concert hall, music club or event venue today.',
    category: 'music_events',
  },
  {
    title: 'Culture hunt',
    description: 'Discover a market, café, festival spot or old neighbourhood today.',
    category: 'culture',
  },
  {
    title: 'Follow the coastline',
    description: 'Discover any beach or coastal spot today.',
    category: 'coast',
  },
  {
    title: 'Oddity of the day',
    description: 'Discover any curiosity today.',
    category: 'other',
  },
  {
    title: 'Art attack',
    description: 'Discover a gallery, museum, mural or piece of street art today.',
    category: 'art',
  },
  {
    title: 'Sound check',
    description: 'Discover any music venue or event spot today.',
    category: 'music_events',
  },
  {
    title: 'Wander anywhere new',
    description: 'Discover any place you have never visited.',
    category: null,
  },
];

/**
 * The Curiosities day cycles through these, one per 9-day cycle, so each Oddity of the day has its
 * own quest. Any curiosity discovered that day counts; the quest is a suggestion the app can't check.
 */
export const ODDITIES: readonly { title: string; quest: string }[] = [
  {
    title: 'Look up!',
    quest:
      'Find something odd above eye level: a carved face, a strange weathervane, a forgotten sign.',
  },
  {
    title: 'Behind the door',
    quest: 'Look for one tucked down a side street most people walk past.',
  },
  { title: 'The smallest thing', quest: 'Photograph its tiniest detail.' },
  {
    title: 'Secret staircase',
    quest: 'Look for one reached by steps, an alley or a hidden passage.',
  },
  { title: 'Local legend', quest: 'Find one with a myth, ghost story or legend attached.' },
  {
    title: 'Lost and found',
    quest: 'Find one that was once forgotten, abandoned or rediscovered.',
  },
  {
    title: 'Saints and superstitions',
    quest: 'Find one linked to a local belief or lucky ritual.',
  },
  {
    title: 'Unsolved',
    quest: 'Find one nobody can fully explain: why it is there, who made it, what it was for.',
  },
  { title: 'Royal oddity', quest: 'Find one with a story about a king, queen or noble eccentric.' },
  {
    title: 'Bones and stones',
    quest: 'Find one made of something unexpected: bones, shells, bottles or cork.',
  },
  {
    title: 'Tiny architecture',
    quest: 'Hunt for the smallest building, door or chapel you can find.',
  },
  { title: 'Odd one out', quest: 'Find one that looks completely out of place where it stands.' },
  {
    title: 'Ancient puzzle',
    quest: 'Find one older than the town around it: a standing stone, a fossil, a footprint.',
  },
  {
    title: 'Mechanical marvel',
    quest: 'Find one with old machinery: a lift, a clock, a mill or a pump.',
  },
  { title: 'Water wonders', quest: 'Find a curious fountain, well, spring or old washhouse.' },
  {
    title: 'Sweet secret',
    quest: 'Find one with a sweet or pastry made to a centuries-old recipe.',
  },
  {
    title: 'Follow your nose',
    quest: 'Find one you can smell before you see it: a bakery, a market, the sea.',
  },
  {
    title: 'Listen closely',
    quest: 'Record five seconds of its sound: bells, trams, gulls or chatter.',
  },
  { title: 'Take the slow road', quest: 'Get there by tram, funicular, ferry or on foot.' },
  { title: 'Ask a local', quest: 'Ask someone there for a story about it.' },
  { title: 'Compass point', quest: 'Pick the one furthest north (or west) you can reach today.' },
  {
    title: 'Spot the octopus',
    quest: 'Find something shaped like a tentacle, swirl or spiral there.',
  },
  {
    title: 'Cabinet of curiosities',
    quest: 'Photograph three odd objects nearby for your collection.',
  },
];

/**
 * October 2026 to September 2027. Where dates overlap, the shorter range wins (a single day
 * inside a month-long campaign), so World Music Day beats Santos Populares on 21 June.
 */
export const DATED_CHALLENGES: readonly DatedChallenge[] = [
  {
    campaign: 'autumn-hills',
    title: 'Autumn in the hills',
    description: 'Autumn campaign: discover any nature spot while the leaves turn.',
    category: 'nature',
    startsOn: '2026-10-17',
    endsOn: '2026-10-25',
  },
  {
    campaign: 'sao-martinho',
    title: 'São Martinho',
    description: 'Chestnuts and new wine: discover a market, café or local tradition today.',
    category: 'culture',
    startsOn: '2026-11-11',
    endsOn: '2026-11-11',
  },
  {
    campaign: 'winter-lights',
    title: 'Winter lights',
    description:
      'Winter campaign: discover a heritage site or old town square while the festive lights are up.',
    category: 'heritage',
    startsOn: '2026-12-12',
    endsOn: '2027-01-06',
  },
  {
    campaign: 'warm-up-indoors',
    title: 'Warm up indoors',
    description: 'Winter campaign: discover a museum or gallery on a cold day.',
    category: 'art',
    startsOn: '2027-01-18',
    endsOn: '2027-01-31',
  },
  {
    campaign: 'carnaval',
    title: 'Carnaval',
    description: 'Carnival weekend: discover a festival spot, market or local tradition.',
    category: 'culture',
    startsOn: '2027-02-06',
    endsOn: '2027-02-09',
  },
  {
    campaign: 'monuments-day',
    title: 'International Day for Monuments and Sites',
    description: 'Discover any heritage site today.',
    category: 'heritage',
    startsOn: '2027-04-18',
    endsOn: '2027-04-18',
  },
  {
    campaign: 'freedom-day',
    title: 'Freedom Day',
    description: '25 de Abril: discover a square, market or neighbourhood where the city gathers.',
    category: 'culture',
    startsOn: '2027-04-25',
    endsOn: '2027-04-25',
  },
  {
    campaign: 'museum-day',
    title: 'International Museum Day',
    description: 'Discover a museum or gallery today.',
    category: 'art',
    startsOn: '2027-05-18',
    endsOn: '2027-05-18',
  },
  {
    campaign: 'santos-populares',
    title: 'Santos Populares',
    description: 'June’s saints’ festivals: discover a festival spot, market or old neighbourhood.',
    category: 'culture',
    startsOn: '2027-06-01',
    endsOn: '2027-06-30',
  },
  {
    campaign: 'world-music-day',
    title: 'World Music Day',
    description: 'Discover any music venue or event spot today.',
    category: 'music_events',
    startsOn: '2027-06-21',
    endsOn: '2027-06-21',
  },
  {
    campaign: 'summer-coast',
    title: 'Summer by the sea',
    description: 'Summer campaign: discover any beach or coastal spot.',
    category: 'coast',
    startsOn: '2027-07-24',
    endsOn: '2027-08-01',
  },
  {
    campaign: 'car-free-day',
    title: 'World Car-Free Day',
    description: 'Leave the car at home: walk to any place you have never discovered.',
    category: null,
    startsOn: '2027-09-22',
    endsOn: '2027-09-22',
  },
  {
    campaign: 'heritage-days',
    title: 'European Heritage Days',
    description: 'Discover any heritage site this weekend.',
    category: 'heritage',
    startsOn: '2027-09-24',
    endsOn: '2027-09-26',
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days since 1970-01-01 for a YYYY-MM-DD date (the server's `d - date '1970-01-01'`). */
export function epochDay(date: string): number {
  return Math.round(Date.parse(`${date}T00:00:00Z`) / DAY_MS);
}

/** Position of the Curiosities day in the rotation. */
export const ODDITY_SLOT = CHALLENGE_ROTATION.findIndex((c) => c.category === 'other');

export function rotationFor(date: string): ChallengeDef {
  const day = epochDay(date);
  const n = CHALLENGE_ROTATION.length;
  if (day % n !== ODDITY_SLOT) return CHALLENGE_ROTATION[day % n]!;
  const odd = ODDITIES[Math.floor(day / n) % ODDITIES.length]!;
  return {
    title: `Oddity of the day: ${odd.title}`,
    description: `Discover any curiosity today. ${odd.quest}`,
    category: 'other',
  };
}

/** Range length in days; shorter ranges take precedence. */
const span = (c: DatedChallenge) => epochDay(c.endsOn) - epochDay(c.startsOn);

/** Today's challenge: a dated one covering the date (shortest range first), else the rotation. */
export function challengeForDate(date: string): ChallengeDef & { campaign: string | null } {
  const dated = DATED_CHALLENGES.filter((c) => c.startsOn <= date && date <= c.endsOn).sort(
    (a, b) => span(a) - span(b),
  )[0];
  if (dated) {
    const { campaign, title, description, category } = dated;
    return { campaign, title, description, category };
  }
  return { ...rotationFor(date), campaign: null };
}

const lit = (s: string) => `'${s.replace(/'/g, "''")}'`;
const cat = (c: Category | null) => (c ? `${lit(c)}::public.place_category` : 'null');

/** VALUES rows for public.challenge_rotation(), indexed from 0. */
export function rotationValuesSql(): string {
  return CHALLENGE_ROTATION.map(
    (c, i) => `    (${i}, ${lit(c.title)}, ${lit(c.description)}, ${cat(c.category)})`,
  ).join(',\n');
}

/** VALUES rows for public.oddity_of_the_day(), indexed from 0. */
export function oddityValuesSql(): string {
  return ODDITIES.map(
    (o, i) =>
      `    (${i}, ${lit(`Oddity of the day: ${o.title}`)}, ${lit(`Discover any curiosity today. ${o.quest}`)})`,
  ).join(',\n');
}

/** Schedules every dated challenge, widest range first so shorter ones overwrite it. */
export function datedChallengesSql(): string {
  return [...DATED_CHALLENGES]
    .sort((a, b) => span(b) - span(a))
    .map(
      (c) =>
        `select public.schedule_daily_challenge(${lit(c.campaign)}, ${lit(c.title)}, ${lit(
          c.description,
        )}, ${cat(c.category)}, date ${lit(c.startsOn)}, date ${lit(c.endsOn)});`,
    )
    .join('\n');
}
