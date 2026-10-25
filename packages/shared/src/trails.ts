import { seedSourceId } from './details';
import { haversineMeters } from './geo';
import type { LatLng } from './geo';
import type { Category } from './types';

/**
 * Trails: a walk through 4–5 places in order, with a story, and a clue at each stop that you can
 * only answer by looking around you there. Start any time, pause and come back: nothing is timed.
 * The server (start_trail / use_trail_hint / answer_trail_clue) checks answers and pays coins;
 * demo mode mirrors it in apps/mobile/src/demo/trails.ts.
 */

/** Coins for solving a stop's clue with no hints and no wrong answers. */
export const TRAIL_STOP_COINS = 20;
/** Each hint or wrong answer takes this off the stop's coins... */
export const TRAIL_PENALTY = 5;
/** ...but solving a stop always pays at least this. */
export const TRAIL_MIN_STOP_COINS = 5;
/** Paid for finishing the last stop; finishing a trail also counts as a challenge (XP). */
export const TRAIL_COMPLETE_COINS = 50;
/** Hints per stop; each one gives more away. */
export const TRAIL_HINTS = 3;
/** Average walking pace, for the "about N min" estimate. */
const WALK_M_PER_MIN = 75;
/** Paths wind: straight-line distance times this is closer to the real walk. */
const PATH_FACTOR = 1.3;

/** Error codes the trail RPCs raise; the app maps each to an i18n string (trail.error.*). */
export const TRAIL_ERRORS = [
  'unknown_trail',
  'unknown_stop',
  'not_started',
  'not_current',
  'already_solved',
  'no_more_hints',
  'not_discovered',
] as const;
export type TrailError = (typeof TRAIL_ERRORS)[number];

export type TrailClue =
  | { kind: 'choice'; question: string; choices: string[]; answer: string }
  | { kind: 'number'; question: string; answer: string };

export interface TrailStop {
  /** Demo place id; the seed's source_id is seedSourceId(placeId). */
  placeId: string;
  story: string;
  clue: TrailClue;
  hints: [string, string, string];
}

export interface Trail {
  slug: string;
  region: string;
  title: string;
  intro: string;
  outro: string;
  /** Colour and art come from this category. */
  theme: Category;
  stops: TrailStop[];
}

/** Coins a stop pays once solved, after hints and wrong answers. Mirrors trail_stop_coins(). */
export function trailStopCoins(hintsUsed: number, wrong: number): number {
  return Math.max(TRAIL_MIN_STOP_COINS, TRAIL_STOP_COINS - TRAIL_PENALTY * (hintsUsed + wrong));
}

/** How answers are compared: case, outer spaces and repeated spaces don't matter. */
export function normalizeAnswer(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function isRightAnswer(clue: TrailClue, given: string): boolean {
  return normalizeAnswer(given) === normalizeAnswer(clue.answer);
}

/** The walk from the first stop to the last, in metres and minutes (rounded to 5). */
export function trailWalk(points: LatLng[]): { meters: number; minutes: number } {
  let straight = 0;
  for (let i = 1; i < points.length; i++) straight += haversineMeters(points[i - 1]!, points[i]!);
  const meters = Math.round((straight * PATH_FACTOR) / 50) * 50;
  return { meters, minutes: Math.max(5, Math.round(meters / WALK_M_PER_MIN / 5) * 5) };
}

// Every story line comes from the place's checked Learn facts (packages/shared/src/details), and
// every clue can be answered by looking around at the place.
export const TRAILS: Trail[] = [
  {
    slug: 'sintra-artist-king',
    region: 'sintra',
    title: 'The Artist King',
    intro:
      'In the 1800s a German prince known as the “Artist King”, Ferdinand II, fell for these hills. He saved a ruined castle, raised a palace on a peak and planted a park with trees from around the world. Follow him through five of his projects.',
    outro:
      'You’ve walked the Artist King’s Sintra: the castle he saved, the palace he dreamed up, his cross on the summit, his garden and the chalet he built for love.',
    theme: 'heritage',
    stops: [
      {
        placeId: 'demo-mouros',
        story:
          'The Moors built these walls in the 8th and 9th centuries, and Christian forces took them after Lisbon fell in 1147. By Ferdinand’s day they were a ruin, and he restored them while building his palace next door.',
        clue: {
          kind: 'choice',
          question: 'Climb to the highest point of the walls. What is that tower called?',
          choices: ['The Royal Tower', 'The Bell Tower', 'The Watchman’s Tower', 'The Moors’ Gate'],
          answer: 'The Royal Tower',
        },
        hints: [
          'It is the highest point of the walls.',
          'Check the names on the signs along the walls.',
          'It is named after royalty.',
        ],
      },
      {
        placeId: 'demo-pena',
        story:
          'Ferdinand built his palace in the mid-1800s around the ruins of a 16th-century monastery, whose cloister and chapel survive inside. It is part of the Cultural Landscape of Sintra, a UNESCO World Heritage Site since 1995.',
        clue: {
          kind: 'choice',
          question: 'Find the Triton arch. What holds up the window on its back?',
          choices: ['A sea monster', 'A dragon', 'A lion', 'An eagle'],
          answer: 'A sea monster',
        },
        hints: [
          'The arch is named after it.',
          'Triton was a god of the sea.',
          'It lives in the waves.',
        ],
      },
      {
        placeId: 'demo-cruz-alta',
        story:
          'At about 529 m this is the roof of the Sintra hills. Ferdinand replaced the original 16th-century cross with a new one in the 1800s.',
        clue: {
          kind: 'choice',
          question: 'Stand by the cross and look down. Whose yellow towers do you see below you?',
          choices: ['Pena Palace', 'Monserrate Palace', 'Quinta da Regaleira', 'Seteais Palace'],
          answer: 'Pena Palace',
        },
        hints: [
          'You have already been there today.',
          'It is red and yellow.',
          'Ferdinand built it.',
        ],
      },
      {
        placeId: 'demo-sintra-valley-of-lakes',
        story:
          'Ferdinand laid out Pena Park as a Romantic garden with trees from around the world, and threaded this valley with a chain of ponds.',
        clue: {
          kind: 'choice',
          question: 'A little castle sits on the water. Who was it built for?',
          choices: ['Ducks', 'Swans', 'The king’s children', 'The gardener'],
          answer: 'Ducks',
        },
        hints: ['Whoever lives there can swim.', 'It is not the swans.', 'Listen for quacking.'],
      },
      {
        placeId: 'demo-condessa',
        story:
          'Ferdinand built this Alpine-style chalet in the 1860s with Elise Hensler, the opera singer he later married. Fire gutted it in 1999; it was restored and reopened in 2011.',
        clue: {
          kind: 'choice',
          question: 'What local material trims its windows and doors?',
          choices: ['Cork', 'Marble', 'Iron', 'Bamboo'],
          answer: 'Cork',
        },
        hints: [
          'It is the local material of the Sintra hills.',
          'It comes from the bark of a tree.',
          'Wine bottles are stopped with it.',
        ],
      },
    ],
  },
  {
    slug: 'sintra-magpies-millionaire',
    region: 'sintra',
    title: 'Kings, Magpies and a Millionaire',
    intro:
      'Sintra has drawn kings, consuls and millionaires for nine centuries. Walk through the old town from a church as old as Portugal’s first king’s conquest to a consul’s arch with the best view in town.',
    outro:
      'From a church founded after 1147 to an arch built for a future king in 1802: nine centuries of Sintra in one walk.',
    theme: 'heritage',
    stops: [
      {
        placeId: 'demo-sintra-santa-maria',
        story:
          'One of Sintra’s oldest churches, founded after Afonso Henriques took Sintra in 1147. It was built as Romanesque gave way to Gothic, and it has been a National Monument since 1922.',
        clue: {
          kind: 'number',
          question: 'Step inside. How many naves (aisles) does the church have?',
          answer: '3',
        },
        hints: [
          'Count the rows of space between the columns, front to back.',
          'More than one.',
          'Fewer than four.',
        ],
      },
      {
        placeId: 'demo-sintra-national-palace',
        story:
          'The two cone-shaped chimneys, about 33 m tall, belong to the royal kitchen of the best-preserved medieval royal palace in Portugal. Kings used it for centuries.',
        clue: {
          kind: 'choice',
          question: 'In the Magpie Room, every magpie holds the same motto. What does it say?',
          choices: ['Por bem', 'Por Portugal', 'Sempre fiel', 'Ordem e progresso'],
          answer: 'Por bem',
        },
        hints: [
          'There are 136 magpies on the ceiling.',
          'It is just two words.',
          'It means “for the good”.',
        ],
      },
      {
        placeId: 'demo-regaleira',
        story:
          'António Augusto Carvalho Monteiro, nicknamed “Monteiro the Millionaire”, had the Italian architect Luigi Manini design this palace and garden in the early 1900s. His strangest idea goes down, not up.',
        clue: {
          kind: 'number',
          question: 'Spiral down the Initiation Well. How many landings does it have?',
          answer: '9',
        },
        hints: ['The well is about 27 m deep.', 'More than seven.', 'One fewer than ten.'],
      },
      {
        placeId: 'demo-seteais',
        story:
          'A neoclassical palace built in the late 1700s for the Dutch consul Daniel Gildemeester. Its triumphal arch celebrates a visit by the future King John VI in 1802. The palace is a hotel today, but the arch and its lawn are open to walk to.',
        clue: {
          kind: 'choice',
          question:
            'Stand under the arch and look up the hill. Which palace sits in the middle of the frame?',
          choices: [
            'Pena Palace',
            'Quinta da Regaleira',
            'Monserrate Palace',
            'Sintra National Palace',
          ],
          answer: 'Pena Palace',
        },
        hints: [
          'It is on the highest peak you can see.',
          'It is red and yellow.',
          'Ferdinand II built it.',
        ],
      },
    ],
  },
];

export const trailBySlug = (slug: string) => TRAILS.find((t) => t.slug === slug);

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const arr = (xs: string[]) => `array[${xs.map(q).join(', ')}]::text[]`;

/**
 * The trails as SQL, for the migration and the dev seed (trails.test.ts keeps both in sync).
 * Public content goes in trails / trail_stops; answers and hints only in trail_secrets.
 */
export function trailsSql(trails: Trail[] = TRAILS): string {
  return trails
    .map((t) => {
      const trail = `insert into public.trails (slug, region_id, title, intro, outro, theme, position)
select ${q(t.slug)}, r.id, ${q(t.title)}, ${q(t.intro)}, ${q(t.outro)}, ${q(t.theme)}, ${TRAILS.indexOf(t) + 1}
from public.regions r where r.slug = ${q(t.region)}
on conflict (slug) do update set title = excluded.title, intro = excluded.intro, outro = excluded.outro,
  theme = excluded.theme, position = excluded.position;`;
      const stops = t.stops.map((s, i) => {
        const choices = s.clue.kind === 'choice' ? arr(s.clue.choices) : 'null';
        return `insert into public.trail_stops (trail_id, position, place_id, story, question, kind, choices)
select t.id, ${i + 1}, p.id, ${q(s.story)}, ${q(s.clue.question)}, ${q(s.clue.kind)}, ${choices}
from public.trails t join public.places p on p.source = 'seed' and p.source_id = ${q(seedSourceId(s.placeId))}
where t.slug = ${q(t.slug)}
on conflict (trail_id, position) do update set place_id = excluded.place_id, story = excluded.story,
  question = excluded.question, kind = excluded.kind, choices = excluded.choices;
insert into public.trail_secrets (trail_id, position, answer, hints)
select t.id, ${i + 1}, ${q(s.clue.answer)}, ${arr(s.hints)} from public.trails t where t.slug = ${q(t.slug)}
on conflict (trail_id, position) do update set answer = excluded.answer, hints = excluded.hints;`;
      });
      return [trail, ...stops].join('\n');
    })
    .join('\n');
}
