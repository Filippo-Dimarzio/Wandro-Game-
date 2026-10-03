import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import {
  DEMO_PLACES,
  gemToReveal,
  hiddenGemHint,
  type HiddenHint,
  type LatLng,
} from '@wandro/shared';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

// ~20 m steps: enough to notice walking, without a server call per GPS jitter.
const round = (n: number) => Math.round(n * 5000) / 5000;

/**
 * Reveals the nearest hidden gem once the player is within 200 m, and gives a coarse hint
 * for the ones still secret. Only real positions (or the demo) can reveal: never the
 * fallback centre used when location is off.
 */
export function useHiddenGems(position: LatLng, canReveal: boolean) {
  const qc = useQueryClient();
  const revealed = useSession((s) => s.revealed);
  const unlocked = useSession((s) => s.unlocked);
  const reveal = useSession((s) => s.reveal);
  const lat = round(position.lat);
  const lng = round(position.lng);

  const demoHint = useMemo(
    () =>
      isDemo
        ? hiddenGemHint(
            DEMO_PLACES,
            { lat, lng },
            new Set(Object.keys(revealed)),
            new Set(Object.keys(unlocked)),
          )
        : null,
    [lat, lng, revealed, unlocked],
  );

  const serverHint = useQuery({
    queryKey: ['hidden-hint', lat.toFixed(3), lng.toFixed(3)],
    enabled: !isDemo,
    queryFn: async () => {
      const { data, error } = await supabase!.rpc('hidden_gem_hint', { p_lat: lat, p_lng: lng });
      if (error) throw error;
      return data as { count: number; hint: HiddenHint | null };
    },
  });

  useEffect(() => {
    if (!canReveal) return;
    if (isDemo) {
      const gem = gemToReveal(
        DEMO_PLACES,
        { lat, lng },
        new Set(Object.keys(useSession.getState().revealed)),
        new Set(Object.keys(useSession.getState().unlocked)),
      );
      if (gem) reveal(gem.id);
      return;
    }
    let cancelled = false;
    supabase!.rpc('reveal_hidden_gem', { p_lat: lat, p_lng: lng }).then(({ data, error }) => {
      if (cancelled || error || !Array.isArray(data) || data.length === 0) return;
      reveal((data[0] as { id: string }).id);
      qc.invalidateQueries({ queryKey: ['places'] });
      qc.invalidateQueries({ queryKey: ['hidden-hint'] });
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, canReveal, reveal, qc]);

  return (isDemo ? demoHint : serverHint.data) ?? { count: 0, hint: null };
}
