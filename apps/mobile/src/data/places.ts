import { useQuery } from '@tanstack/react-query';
import { DEMO_PLACES, type Place } from '@wandro/shared';
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
  };
}

export function usePlaces(center: { lat: number; lng: number }) {
  // Round so small GPS jitter doesn't refetch.
  const key = [center.lat.toFixed(2), center.lng.toFixed(2)];
  return useQuery({
    queryKey: ['places', ...key, isDemo],
    queryFn: async (): Promise<Place[]> => {
      if (!supabase) return DEMO_PLACES;
      const { data, error } = await supabase.rpc('nearby_places', {
        lat: center.lat,
        lng: center.lng,
        radius_m: 30000,
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
