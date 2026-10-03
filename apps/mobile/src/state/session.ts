import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LatLng } from '@wandro/shared';

export interface LocalProfile {
  username: string;
  homeCity: string;
  explorerStyles: string[];
}

export interface DemoUnlock {
  at: string;
  points: number;
}

export interface DemoChallengeState {
  date: string;
  startedAt: string;
  completedAt?: string;
}

interface SessionState {
  onboarded: boolean;
  profile: LocalProfile | null;
  /** Demo mode only: on-device unlocks. With a backend, unlocks come from the server. */
  unlocked: Record<string, DemoUnlock>;
  challenge: DemoChallengeState | null;
  bonusPoints: number;
  /** Demo helper so the app can be explored from anywhere (e.g. in a browser). */
  teleport: LatLng | null;
  /** Place that was just unlocked, so the map can animate the fog clearing. */
  justUnlocked: string | null;

  completeOnboarding: (profile: LocalProfile) => void;
  unlock: (placeId: string, points: number) => void;
  setChallenge: (c: DemoChallengeState) => void;
  addBonus: (points: number) => void;
  setTeleport: (p: LatLng | null) => void;
  clearJustUnlocked: () => void;
  reset: () => void;
}

const initial = {
  onboarded: false,
  profile: null,
  unlocked: {},
  challenge: null,
  bonusPoints: 0,
  teleport: null,
  justUnlocked: null,
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      ...initial,
      completeOnboarding: (profile) => set({ onboarded: true, profile }),
      unlock: (placeId, points) =>
        set((s) =>
          s.unlocked[placeId]
            ? s
            : {
                unlocked: { ...s.unlocked, [placeId]: { at: new Date().toISOString(), points } },
                justUnlocked: placeId,
              },
        ),
      setChallenge: (challenge) => set({ challenge }),
      addBonus: (points) => set((s) => ({ bonusPoints: s.bonusPoints + points })),
      setTeleport: (teleport) => set({ teleport }),
      clearJustUnlocked: () => set({ justUnlocked: null }),
      reset: () => set(initial),
    }),
    {
      name: 'wandro-session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ justUnlocked: _j, ...rest }) => rest,
    },
  ),
);
