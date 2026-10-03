import { useEffect, useRef } from 'react';
import { arrivalFlight, regionFor, type LatLng } from '@wandro/shared';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

/**
 * Checks once per city whether the player has flown in from another launch city, and if so
 * queues the arrival flight. The server decides (check_arrival); the demo mirrors it.
 * Only real positions count: never the fallback centre used when location is off.
 */
export function useArrival(position: LatLng, canCheck: boolean) {
  const region = regionFor(position)?.slug ?? null;
  const setLastRegion = useSession((s) => s.setLastRegion);
  const startFlight = useSession((s) => s.startFlight);
  const latest = useRef(position);
  latest.current = position;

  useEffect(() => {
    if (!canCheck || !region) return;
    if (isDemo) {
      const flight = arrivalFlight(useSession.getState().lastRegion, region);
      setLastRegion(region);
      if (flight) startFlight({ from: flight.from.slug, to: flight.to.slug, km: flight.km });
      return;
    }
    let cancelled = false;
    supabase!
      .rpc('check_arrival', { p_lat: latest.current.lat, p_lng: latest.current.lng })
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const r = data as { arrived: boolean; from: string | null; to: string | null; km?: number };
        if (r.to) setLastRegion(r.to);
        if (r.arrived && r.from && r.to) startFlight({ from: r.from, to: r.to, km: r.km ?? 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [region, canCheck, setLastRegion, startFlight]);
}
