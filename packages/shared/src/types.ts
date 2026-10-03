export type Category = 'coast' | 'nature' | 'heritage' | 'culture' | 'music_events' | 'other';

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
  photoCredit?: string;
  /** Only for places with set times (venues, events, markets). Absent = always accessible. */
  hours?: OpeningSlot[];
  /** Region slug (see REGIONS), e.g. 'lisbon'. */
  region?: string;
  /** Hidden gem: kept off the map until the player comes within HIDDEN_REVEAL_RADIUS_M. */
  hidden?: boolean;
}

export interface VisitSummary {
  placeId: string;
  verifiedAt: string;
  points: number;
}
