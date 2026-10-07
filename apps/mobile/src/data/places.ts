import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  BASE_POINTS,
  DEFAULT_GEOFENCE_RADIUS_M,
  DEMO_PLACES,
  haversineMeters,
  NEARBY_RADIUS_M,
  regionFor,
  visiblePlaces,
  type Place,
  type PlaceDetails,
  type PlaceFact,
} from '@wandro/shared';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

interface PlaceRow {
  id: string;
  name: string;
  description: string | null;
  category: Place['category'];
  lat: number;
  lng: number;
  geofence_radius_m: number;
  base_points: number;
  unique_visitors: number;
  photo_url: string | null;
  photo_author: string | null;
  photo_license?: string | null;
  photo_source?: string | null;
  is_hidden?: boolean;
  /** Learn and Plan content; an empty object when the place has none yet. */
  details?: Partial<PlaceDetails> | null;
}

export function rowToPlace(r: PlaceRow): Place {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    category: r.category,
    lat: r.lat,
    lng: r.lng,
    geofenceRadiusM: r.geofence_radius_m,
    basePoints: r.base_points,
    uniqueVisitors: r.unique_visitors,
    photoUrl: r.photo_url ?? undefined,
    photoCredit: r.photo_author ?? undefined,
    photoLicense: r.photo_license ?? undefined,
    photoSource: r.photo_source ?? undefined,
    region: regionFor(r)?.slug,
    ...(r.is_hidden && { hidden: true }),
    ...(r.details?.teaser && {
      details: {
        ...r.details,
        // Older rows stored facts as plain strings; read them as unsourced facts.
        facts: (r.details.facts ?? []).map((f: PlaceFact | string) =>
          typeof f === 'string' ? { text: f } : f,
        ),
      } as PlaceDetails,
    }),
  };
}

export function usePlaces(center: { lat: number; lng: number }) {
  // Round so small GPS jitter doesn't refetch.
  const key = [center.lat.toFixed(2), center.lng.toFixed(2)];
  // Select the stable array and derive from it; filtering inside the selector would return a
  // new array on every render and loop forever.
  const submissions = useSession((s) => s.submissions);
  const approved = useMemo(() => submissions.filter((x) => x.status === 'approved'), [submissions]);
  const approvedKey = approved.map((x) => x.id).join(',');
  const revealed = useSession((s) => s.revealed);
  const unlocked = useSession((s) => s.unlocked);
  // Demo: gems stay hidden until revealed or discovered, like the places RLS policy.
  const knownKey = [...Object.keys(revealed), ...Object.keys(unlocked)].sort().join(',');
  return useQuery({
    queryKey: ['places', ...key, isDemo, approvedKey, isDemo ? knownKey : ''],
    queryFn: async (): Promise<Place[]> => {
      if (!supabase) {
        // Demo: approved suggestions become new missions, like approve_place_submission().
        const extra: Place[] = approved.map((x) => ({
          id: x.id,
          name: x.name,
          description: x.description,
          category: x.category,
          lat: x.lat,
          lng: x.lng,
          geofenceRadiusM: DEFAULT_GEOFENCE_RADIUS_M,
          basePoints: BASE_POINTS[x.category],
          uniqueVisitors: 0,
        }));
        const known = (o: Record<string, unknown>) => new Set(Object.keys(o));
        return visiblePlaces([...DEMO_PLACES, ...extra], known(revealed), known(unlocked)).filter(
          (p) => haversineMeters(center, p) <= NEARBY_RADIUS_M,
        );
      }
      const { data, error } = await supabase.rpc('nearby_places', {
        lat: center.lat,
        lng: center.lng,
        radius_m: NEARBY_RADIUS_M,
      });
      if (error) throw error;
      return (data as PlaceRow[]).map(rowToPlace);
    },
  });
}

/** IDs of places the current user has discovered. */
export function useUnlockedIds(): { ids: Set<string> } {
  const unlocked = useSession((s) => s.unlocked);
  const server = useQuery({
    queryKey: ['my-visits'],
    enabled: !isDemo,
    queryFn: async () => {
      const { data, error } = await supabase!.from('visits').select('place_id');
      if (error) throw error;
      return data.map((v) => v.place_id as string);
    },
  });
  if (!isDemo) return { ids: new Set(server.data ?? []) };
  return { ids: new Set(Object.keys(unlocked)) };
}
