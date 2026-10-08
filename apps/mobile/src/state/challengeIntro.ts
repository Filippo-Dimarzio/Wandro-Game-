import { create } from 'zustand';
import type { Place } from '@wandro/shared';

/** UI state only: the challenge whose intro card is open (see ChallengeIntro). */
export const useChallengeIntro = create<{
  place: Place | null;
  show: (place: Place) => void;
  hide: () => void;
}>((set) => ({
  place: null,
  show: (place) => set({ place }),
  hide: () => set({ place: null }),
}));
