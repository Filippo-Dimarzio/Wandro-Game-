import * as Location from 'expo-location';
import { useEffect } from 'react';
import { create } from 'zustand';
import type { LatLng } from '@wandro/shared';
import { SINTRA_CENTER, isDemo } from './env';
import { useSession } from '@/state/session';

export type LocationPermission = 'granted' | 'denied' | 'undetermined';

export interface UserLocation {
  position: LatLng;
  accuracy: number | null;
  /** True when the position is real GPS rather than the demo fallback/teleport. */
  isReal: boolean;
  /** Android reports positions from mock-location apps; the server flags those check-ins. */
  isMocked: boolean;
  permission: LocationPermission;
  /** Ask for location (the system prompt). Granting it switches the demo to your real position. */
  request: () => Promise<LocationPermission>;
}

interface Fix {
  position: LatLng;
  accuracy: number | null;
  isMocked: boolean;
}

/**
 * One location for the whole app (UI state only): every screen sees the same permission and the
 * same live fix, so allowing location on the map moves your explorer everywhere at once.
 */
const useLocationStore = create<{
  permission: LocationPermission | null;
  fix: Fix | null;
}>(() => ({ permission: null, fix: null }));

let subscribers = 0;
let watch: Promise<Location.LocationSubscription | null> | null = null;

/** Follow the player in real time while any screen needs their position (foreground only). */
function startWatching() {
  if (watch) return;
  watch = Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, distanceInterval: 3, timeInterval: 2000 },
    (l) =>
      useLocationStore.setState({
        fix: {
          position: { lat: l.coords.latitude, lng: l.coords.longitude },
          accuracy: l.coords.accuracy,
          isMocked: !!l.mocked,
        },
      }),
  ).catch(() => null);
}

function stopWatching() {
  watch?.then((s) => s?.remove());
  watch = null;
}

export async function requestLocation(): Promise<LocationPermission> {
  const p = await Location.requestForegroundPermissionsAsync().catch(() => ({ status: 'denied' }));
  const permission = p.status as LocationPermission;
  useLocationStore.setState({ permission });
  // The demo's teleport stands in for GPS; once you share your real position, that wins.
  if (permission === 'granted' && isDemo) useSession.getState().setTeleport(null);
  return permission;
}

/** Foreground-only location (GDPR: never in the background). */
export function useLocation(): UserLocation {
  const teleport = useSession((s) => s.teleport);
  const permission = useLocationStore((s) => s.permission);
  const fix = useLocationStore((s) => s.fix);

  useEffect(() => {
    if (useLocationStore.getState().permission !== null) return;
    Location.getForegroundPermissionsAsync()
      .then((p) => useLocationStore.setState({ permission: p.status as LocationPermission }))
      .catch(() => useLocationStore.setState({ permission: 'denied' }));
  }, []);

  useEffect(() => {
    if (permission !== 'granted') return;
    subscribers += 1;
    startWatching();
    return () => {
      subscribers -= 1;
      if (subscribers === 0) stopWatching();
    };
  }, [permission]);

  const known = permission ?? 'undetermined';
  if (isDemo && teleport)
    return {
      position: teleport,
      accuracy: 5,
      isReal: false,
      isMocked: false,
      permission: known,
      request: requestLocation,
    };
  if (fix) return { ...fix, isReal: true, permission: known, request: requestLocation };
  return {
    position: SINTRA_CENTER,
    accuracy: isDemo ? 5 : null,
    isReal: false,
    isMocked: false,
    permission: known,
    request: requestLocation,
  };
}
