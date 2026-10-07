export type Category =
  'coast' | 'nature' | 'heritage' | 'culture' | 'art' | 'music_events' | 'other';

/** 0 = Sunday … 6 = Saturday, matching Date#getDay(). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * A recurring opening window in the place's local time ("HH:MM", 24 h).
 * A close at or before the open time runs past midnight into the next day.
 */
export interface OpeningSlot {
  days: Weekday[];
  open: string;
  close: string;
}

export interface Place {
  id: string;
  name: string;
  description: string;
  category: Category;
  lat: number;
  lng: number;
  geofenceRadiusM: number;
  basePoints: number;
  uniqueVisitors: number;
  photoUrl?: string;
  /** Photo author, licence and source page (Wikimedia Commons): shown as attribution. */
  photoCredit?: string;
  photoLicense?: string;
  photoSource?: string;
  /** Only for places with set times (venues, events, markets). Absent = always accessible. */
  hours?: OpeningSlot[];
  /** Region slug (see REGIONS), e.g. 'lisbon'. */
  region?: string;
  /** Hidden gem: kept off the map until the player comes within HIDDEN_REVEAL_RADIUS_M. */
  hidden?: boolean;
  /** Learn and Plan content for the place sheet (see details/). */
  details?: PlaceDetails;
}

/** How hard a place is to reach on foot, from easiest. */
export type PlaceAccess = 'step_free' | 'some_steps' | 'steep' | 'trail';

/** What a visit costs: free, a ticket, or money to spend inside (a café, a bar, a tasting). */
export type PlaceCost = 'free' | 'ticket' | 'paid';

/**
 * Optional story and practical notes shown on the place sheet: the Learn tab (teaser, facts, a
 * detail to look for) and the Plan tab. Facts after the first stay blurred until discovery.
 */
export interface PlaceDetails {
  /** One line on why it's worth going. */
  teaser: string;
  /** One to three short, checkable facts. */
  facts: string[];
  /** Something to spot once you're there. */
  lookFor?: string;
  bestTime?: string;
  /** Typical visit length in minutes. */
  durationMin?: number;
  cost?: PlaceCost;
  access?: PlaceAccess;
  /** Practical or safety note, e.g. "Private estate: view it from the road". */
  tip?: string;
}

export interface VisitSummary {
  placeId: string;
  verifiedAt: string;
  points: number;
}
