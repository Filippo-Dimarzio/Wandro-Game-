import { useEffect, useMemo, useState } from 'react';
import { landmarkOf } from './markers';
import { circleRing, FOG_CLEAR_RADIUS_M, fogPolygon, type Place } from '@wandro/shared';
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
      properties: {
        id: p.id,
        name: p.name,
        category: p.category,
        unlocked: unlockedIds.has(p.id),
        landmark: landmarkOf(p),
      },
      geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
    })),
  };
}

type Ring = [number, number][];

const emptyCollection = { type: 'FeatureCollection' as const, features: [] as GeoJSON.Feature[] };

/** Accuracy circle around the explorer (Find My style); at least 12 m so it stays visible. */
export function accuracyGeoJson(
  user: { lat: number; lng: number },
  accuracyM: number | null | undefined,
) {
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'Polygon' as const,
      coordinates: [circleRing(user, Math.max(12, accuracyM ?? 12))] as Ring[],
    },
  };
}

/** The target's geofence ring and, with the incense trail, a guiding line from the explorer. */
export function guidanceGeoJson(
  user: { lat: number; lng: number },
  target: { lat: number; lng: number; geofenceRadiusM: number } | null | undefined,
  trail: boolean,
) {
  if (!target) return { ring: emptyCollection, line: emptyCollection };
  const ring = {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: circleRing(target, target.geofenceRadiusM),
        },
      },
    ],
  };
  const line = trail
    ? {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: [
                [user.lng, user.lat],
                [target.lng, target.lat],
              ],
            },
          },
        ],
      }
    : emptyCollection;
  return { ring, line };
}
