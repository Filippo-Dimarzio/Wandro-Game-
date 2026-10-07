import { Platform } from 'react-native';
import type { LatLng } from '@wandro/shared';

/** Within this distance directions are on foot; beyond it the maps app picks car or transit. */
export const WALK_MAX_M = 3_000;
/** Beyond this the player isn't in the city yet: show the place itself rather than a route. */
export const ROUTE_MAX_M = 50_000;

/**
 * A maps link to a place. Maps apps route from the device's real location (not the app's, which
 * is simulated in demo mode), so a far-away "walking" route would fail and leave the map on the
 * starting point; this asks for a route only when one makes sense, and never sends our location.
 */
export function directionsUrl(target: LatLng, distance = 0, os: string = Platform.OS): string {
  const q = `${target.lat},${target.lng}`;
  const apple = os === 'ios';
  if (distance > ROUTE_MAX_M)
    return apple
      ? `http://maps.apple.com/?ll=${q}&q=${q}`
      : `https://www.google.com/maps/search/?api=1&query=${q}`;
  const walk = distance <= WALK_MAX_M;
  return apple
    ? `http://maps.apple.com/?daddr=${q}${walk ? '&dirflg=w' : ''}`
    : `https://www.google.com/maps/dir/?api=1&destination=${q}${walk ? '&travelmode=walking' : ''}`;
}
