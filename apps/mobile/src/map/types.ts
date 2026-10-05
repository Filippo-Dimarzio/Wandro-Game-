import type { LatLng, Place } from '@wandro/shared';

export interface PlaceMapProps {
  places: Place[];
  unlockedIds: Set<string>;
  userPosition: LatLng;
  onSelect?: (place: Place) => void;
  /** Non-interactive mini map (e.g. "map of you" on the profile). */
  compact?: boolean;
  recenterSignal?: number;
  /** GPS accuracy in metres, drawn as a Find-My-style circle around your explorer. */
  accuracyM?: number | null;
  /** The adventure being guided to: its geofence ring is highlighted. */
  target?: Place | null;
  /** Incense trail: glow around your explorer and a guiding line to the target. */
  trail?: boolean;
  /** Your explorer and their equipped outfit and hat. */
  avatar?: { explorer?: string; skin?: string; hat?: string };
  /** Keep the camera on your explorer while walking. */
  follow?: boolean;
  /** Fly the camera here (e.g. after picking another city), without moving your explorer. */
  focus?: LatLng | null;
  /** Long-press (or right-click on web) to pin a spot, e.g. to suggest a place. */
  onLongPress?: (position: LatLng) => void;
}
