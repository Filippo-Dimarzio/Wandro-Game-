import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import type { LatLng } from '@wandro/shared';
import { SINTRA_CENTER, isDemo } from './env';
import { useSession } from '@/state/session';

export interface UserLocation {
  position: LatLng;
  accuracy: number | null;
  /** True when the position is real GPS rather than the demo fallback/teleport. */
  isReal: boolean;
  permission: 'granted' | 'denied' | 'undetermined';
  request: () => Promise<void>;
}

/** Foreground-only location (GDPR: never in the background). */
export function useLocation(): UserLocation {
  const teleport = useSession((s) => s.teleport);
  const [permission, setPermission] = useState<UserLocation['permission']>('undetermined');
  const [fix, setFix] = useState<{ position: LatLng; accuracy: number | null } | null>(null);

  useEffect(() => {
    Location.getForegroundPermissionsAsync()
      .then((p) => setPermission(p.status as UserLocation['permission']))
      .catch(() => setPermission('denied'));
  }, []);

  useEffect(() => {
    if (permission !== 'granted') return;
    let sub: Location.LocationSubscription | null = null;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
      (l) =>
        setFix({
          position: { lat: l.coords.latitude, lng: l.coords.longitude },
          accuracy: l.coords.accuracy,
        }),
    )
      .then((s) => (sub = s))
      .catch(() => undefined);
    return () => sub?.remove();
  }, [permission]);

  const request = async () => {
    const p = await Location.requestForegroundPermissionsAsync();
    setPermission(p.status as UserLocation['permission']);
  };

  if (isDemo && teleport)
    return { position: teleport, accuracy: 5, isReal: false, permission, request };
  if (fix) return { ...fix, isReal: true, permission, request };
  return { position: SINTRA_CENTER, accuracy: null, isReal: false, permission, request };
}
