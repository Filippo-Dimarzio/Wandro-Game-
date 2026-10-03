import type { LatLng, Place } from '@wandro/shared';

export interface PlaceMapProps {
  places: Place[];
  unlockedIds: Set<string>;
  userPosition: LatLng;
  onSelect?: (place: Place) => void;
  /** Non-interactive mini map (e.g. "map of you" on the profile). */
  compact?: boolean;
  recenterSignal?: number;
  /** Long-press (or right-click on web) to pin a spot, e.g. to suggest a place. */
  onLongPress?: (position: LatLng) => void;
}
