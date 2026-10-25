import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DEMO_PLACES, TRAIL_ERRORS, TRAILS, type Category, type TrailError } from '@wandro/shared';
import type { ClueResult } from '@/demo/trails';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

export interface TrailStopView {
  position: number;
  placeId: string;
  placeName: string;
  lat: number;
  lng: number;
  story: string;
  question: string;
  kind: 'choice' | 'number';
  choices: string[] | null;
  /** Hints you've already opened, in order. */
  hints: string[];
  wrong: number;
  solved: boolean;
  coins: number | null;
  /** You've discovered this place (a verified visit), so you can answer its clue. */
  discovered: boolean;
}

export interface TrailView {
  slug: string;
  region: string;
  title: string;
  intro: string;
  outro: string;
  theme: Category;
  startedAt: string | null;
  completedAt: string | null;
  stops: TrailStopView[];
}

/** The first unsolved stop, or null once the trail is finished. */
export function currentStop(trail: TrailView): TrailStopView | null {
  return trail.stops.find((s) => !s.solved) ?? null;
}

/** Maps an RPC or demo error to its stable code, for the i18n string trail.error.<code>. */
export function trailErrorCode(e: unknown): TrailError | 'unknown' {
  const msg = e instanceof Error ? e.message : String(e);
  return TRAIL_ERRORS.find((k) => msg.includes(k)) ?? 'unknown';
}

function useDemoTrails(): TrailView[] {
  const state = useSession((s) => s.trails);
  const unlocked = useSession((s) => s.unlocked);
  return TRAILS.map((t) => {
    const progress = state[t.slug];
    return {
      slug: t.slug,
      region: t.region,
      title: t.title,
      intro: t.intro,
      outro: t.outro,
      theme: t.theme,
      startedAt: progress?.startedAt ?? null,
      completedAt: progress?.completedAt ?? null,
      stops: t.stops.map((s, i) => {
        const place = DEMO_PLACES.find((p) => p.id === s.placeId);
        const st = progress?.stops[i + 1];
        return {
          position: i + 1,
          placeId: s.placeId,
          placeName: place?.name ?? '',
          lat: place?.lat ?? 0,
          lng: place?.lng ?? 0,
          story: s.story,
          question: s.clue.question,
          kind: s.clue.kind,
          choices: s.clue.kind === 'choice' ? s.clue.choices : null,
          hints: s.hints.slice(0, st?.hints ?? 0),
          wrong: st?.wrong ?? 0,
          solved: !!st?.solvedAt,
          coins: st?.coins ?? null,
          discovered: !!unlocked[s.placeId],
        };
      }),
    };
  });
}

interface ServerTrail {
  slug: string;
  region_slug: string;
  title: string;
  intro: string;
  outro: string;
  theme: Category;
  started_at: string | null;
  completed_at: string | null;
  stops: {
    position: number;
    place_id: string;
    place_name: string;
    lat: number;
    lng: number;
    story: string;
    question: string;
    kind: 'choice' | 'number';
    choices: string[] | null;
    hints: string[];
    wrong: number;
    solved: boolean;
    coins: number | null;
    discovered: boolean;
  }[];
}

/** Every trail with your progress. The server keeps answers and unopened hints to itself. */
export function useTrails(): { trails: TrailView[]; isLoading: boolean } {
  const demo = useDemoTrails();
  const server = useQuery({
    queryKey: ['trails'],
    enabled: !isDemo,
    queryFn: async (): Promise<TrailView[]> => {
      const { data, error } = await supabase!.rpc('my_trails');
      if (error) throw error;
      return (data as ServerTrail[]).map((t) => ({
        slug: t.slug,
        region: t.region_slug,
        title: t.title,
        intro: t.intro,
        outro: t.outro,
        theme: t.theme,
        startedAt: t.started_at,
        completedAt: t.completed_at,
        stops: t.stops.map((s) => ({
          position: s.position,
          placeId: s.place_id,
          placeName: s.place_name,
          lat: s.lat,
          lng: s.lng,
          story: s.story,
          question: s.question,
          kind: s.kind,
          choices: s.choices,
          hints: s.hints ?? [],
          wrong: s.wrong,
          solved: s.solved,
          coins: s.coins,
          discovered: s.discovered,
        })),
      }));
    },
  });
  if (isDemo) return { trails: demo, isLoading: false };
  return { trails: server.data ?? [], isLoading: server.isLoading };
}

export function useTrail(slug: string | undefined) {
  const { trails, isLoading } = useTrails();
  return { trail: trails.find((t) => t.slug === slug) ?? null, isLoading };
}

function useRefresh() {
  const qc = useQueryClient();
  return (coins: boolean) => {
    qc.invalidateQueries({ queryKey: ['trails'] });
    if (coins) qc.invalidateQueries({ queryKey: ['wallet'] });
  };
}

export function useStartTrail() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async (slug: string) => {
      if (isDemo) return useSession.getState().startTrail(slug);
      const { error } = await supabase!.rpc('start_trail', { p_trail: slug });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => refresh(false),
  });
}

export function useTrailHint() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({ slug, position }: { slug: string; position: number }) => {
      if (isDemo) return useSession.getState().takeTrailHint(slug, position);
      const { data, error } = await supabase!.rpc('use_trail_hint', {
        p_trail: slug,
        p_position: position,
      });
      if (error) throw new Error(error.message);
      return data as string;
    },
    onSuccess: () => refresh(false),
  });
}

export function useAnswerClue() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: async ({
      slug,
      position,
      answer,
    }: {
      slug: string;
      position: number;
      answer: string;
    }): Promise<ClueResult> => {
      if (isDemo) return useSession.getState().answerTrailClue(slug, position, answer);
      const { data, error } = await supabase!.rpc('answer_trail_clue', {
        p_trail: slug,
        p_position: position,
        p_answer: answer,
      });
      if (error) throw new Error(error.message);
      return data as ClueResult;
    },
    onSuccess: (r) => refresh(r.correct),
  });
}
