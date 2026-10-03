import { useEffect, useMemo, useState } from 'react';
import { FOG_CLEAR_RADIUS_M, fogPolygon, type Place } from '@wandro/shared';
import { useSession } from '@/state/session';

const ANIMATION_MS = 1400;

/** Fog polygon; the most recent unlock clears in a growing circle. */
export function useFog(places: Place[], unlockedIds: Set<string>) {
  const justUnlocked = useSession((s) => s.justUnlocked);
  const clearJustUnlocked = useSession((s) => s.clearJustUnlocked);
  const [animRadius, setAnimRadius] = useState<number | null>(null);

  useEffect(() => {
    if (!justUnlocked) return;
    let frame = 0;
    const start = Date.now();
    const tick = () => {
      const k = Math.min(1, (Date.now() - start) / ANIMATION_MS);
      const eased = 1 - Math.pow(1 - k, 3);
      setAnimRadius(FOG_CLEAR_RADIUS_M * eased);
      if (k < 1) frame = requestAnimationFrame(tick);
      else {
        setAnimRadius(null);
        clearJustUnlocked();
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [justUnlocked, clearJustUnlocked]);

  const idsKey = [...unlockedIds].sort().join(',');
  return useMemo(
    () =>
      fogPolygon(
        places
          .filter((p) => unlockedIds.has(p.id))
          .map((p) => ({
            lat: p.lat,
            lng: p.lng,
            radiusM:
              p.id === justUnlocked && animRadius !== null
                ? Math.max(1, animRadius)
                : FOG_CLEAR_RADIUS_M,
          })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [places, idsKey, justUnlocked, animRadius],
  );
}

export function placesGeoJson(places: Place[], unlockedIds: Set<string>) {
  return {
    type: 'FeatureCollection' as const,
    features: places.map((p) => ({
      type: 'Feature' as const,
      id: p.id,
      properties: { id: p.id, name: p.name, category: p.category, unlocked: unlockedIds.has(p.id) },
      geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
    })),
  };
}
