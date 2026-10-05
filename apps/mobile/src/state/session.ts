import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEMO_PLACES,
  FRIEND_BEACON_CODE,
  isBoostActive,
  regionFor,
  STAMP_INK_CODE,
  TIME_KEY_CODE,
  type Category,
  type LatLng,
  type Place,
} from '@wandro/shared';
import {
  applyDailyChallenge,
  applyPurchase,
  applyVisit,
  EMPTY_PROGRESS,
  lisbonDate,
  type DemoProgress,
  type DemoUnlock,
  type LedgerEntry,
  type VisitResult,
} from '@/demo/engine';
import {
  effectiveStatus,
  INITIAL_FRIENDS,
  initialFriendChallenges,
  type DemoFriendChallenge,
  type FriendStatus,
} from '@/demo/friends';
import { DEMO_USERS } from '@/demo/social';

export type { DemoUnlock } from '@/demo/engine';

/** Light, dark, or follow the phone's setting. */
export type ThemePref = 'system' | 'light' | 'dark';

export interface LocalProfile {
  username: string;
  homeCity: string;
  explorerStyles: string[];
  isPrivate?: boolean;
  /** The explorer the player chose as their avatar (EXPLORER_IDS). */
  explorer?: string;
}

export interface DemoChallengeState {
  date: string;
  startedAt: string;
  completedAt?: string;
}

export interface DemoPost {
  id: string;
  placeId: string;
  caption: string;
  photoUri?: string;
  at: string;
}

export interface DemoSubmission {
  id: string;
  name: string;
  description: string;
  category: Category;
  lat: number;
  lng: number;
  status: 'pending' | 'approved' | 'rejected';
  at: string;
}

export interface DemoReport {
  targetType: 'post' | 'profile' | 'friend_challenge';
  targetId: string;
  reason: string;
  at: string;
}

/** Equipment bought in the shop: owned items, and timed boosts with an expiry. */
export interface Inventory {
  owned: Record<string, string>;
  activeUntil: Record<string, string>;
  equipped: { skin?: string; hat?: string };
}

interface SessionState extends DemoProgress {
  onboarded: boolean;
  profile: LocalProfile | null;
  challenge: DemoChallengeState | null;
  /** Demo position (teleport / keyboard walking). Null means real GPS. */
  teleport: LatLng | null;
  /** Place that was just unlocked, so the map can animate the fog clearing. */
  justUnlocked: string | null;
  // Social (demo): accounts you follow, posts you liked, your posts, blocks and reports.
  following: string[];
  liked: Record<string, true>;
  posts: DemoPost[];
  blocked: string[];
  reports: DemoReport[];
  submissions: DemoSubmission[];
  inventory: Inventory;
  /** City stamps collected in demo mode (the server keeps these in city_stamps). */
  stamps: Record<string, { at: string; gold: boolean }>;
  /** Hidden gems this player has walked within range of (demo). */
  revealed: Record<string, string>;
  /** Gem that was just revealed, for the "you found a hidden gem" banner. */
  justRevealed: string | null;
  /** Where the map is looking when browsing another city; null follows the player. */
  browse: LatLng | null;
  friends: Record<string, FriendStatus>;
  friendChallenges: DemoFriendChallenge[];
  /** Last launch city the app was opened in (city only, never coordinates). */
  lastRegion: string | null;
  /** An arrival flight to play, e.g. after landing in another city. */
  flight: { from: string; to: string; km: number } | null;
  /** Bumped when a flight lands, so the map can fly to the new city. */
  landedAt: number;
  /** Demo-only switch so the moderation screens can be tried. */
  demoModerator: boolean;
  installPromptDismissed: boolean;
  prefs: { dailyReminder: boolean; theme?: ThemePref };

  completeOnboarding: (profile: LocalProfile) => void;
  updateProfile: (patch: Partial<LocalProfile>) => void;
  recordVisit: (place: Place, places: Place[]) => VisitResult | null;
  completeChallenge: (qualifying: string[], challengeId: string, places: Place[]) => number;
  setChallenge: (c: DemoChallengeState) => void;
  setTeleport: (p: LatLng | null) => void;
  clearJustUnlocked: () => void;
  toggleFollow: (userId: string) => void;
  toggleLike: (postId: string) => void;
  addPost: (post: DemoPost) => void;
  block: (userId: string) => void;
  report: (r: Omit<DemoReport, 'at'>) => void;
  addSubmission: (s: DemoSubmission) => void;
  reviewSubmission: (id: string, approve: boolean) => void;
  buy: (itemCode: string, price: number, durationMinutes?: number) => boolean;
  equip: (slot: 'skin' | 'hat', itemCode: string | undefined) => void;
  setLastRegion: (slug: string) => void;
  startFlight: (flight: { from: string; to: string; km: number }) => void;
  endFlight: () => void;
  reveal: (placeId: string) => void;
  clearJustRevealed: () => void;
  setBrowse: (p: LatLng | null) => void;
  sendFriendRequest: (userId: string) => FriendStatus;
  respondFriendRequest: (userId: string, accept: boolean) => void;
  removeFriend: (userId: string) => void;
  challengeFriend: (friendId: string, placeId: string, note: string | null) => string;
  respondFriendChallenge: (id: string, accept: boolean) => void;
  /** Same checks as light_beacon(); returns an error code, or null once lit. */
  lightBeacon: (id: string) => 'no_beacon' | 'challenge_not_found' | null;
  setDemoModerator: (on: boolean) => void;
  dismissInstallPrompt: () => void;
  setPref: (key: 'dailyReminder', value: boolean) => void;
  setTheme: (theme: ThemePref) => void;
  reset: () => void;
}

const initial = {
  ...EMPTY_PROGRESS,
  onboarded: false,
  profile: null,
  challenge: null,
  teleport: null,
  justUnlocked: null,
  following: ['demo-user-ines', 'demo-user-tomas'],
  liked: {},
  posts: [],
  blocked: [],
  reports: [],
  submissions: [],
  inventory: { owned: {}, activeUntil: {}, equipped: {} },
  stamps: {},
  revealed: {},
  justRevealed: null,
  browse: null,
  friends: INITIAL_FRIENDS,
  friendChallenges: initialFriendChallenges(),
  lastRegion: null,
  flight: null,
  landedAt: 0,
  demoModerator: false,
  installPromptDismissed: false,
  prefs: { dailyReminder: true },
};

function progressOf(s: SessionState): DemoProgress {
  return {
    unlocked: s.unlocked,
    ledger: s.ledger,
    streak: s.streak,
    lastActiveDate: s.lastActiveDate,
    badges: s.badges,
    challengesCompleted: s.challengesCompleted,
    collectionsClaimed: s.collectionsClaimed,
  };
}

/** Photos kept on the device beyond the last 24 h, so the saved state stays small. */
export const MAX_KEPT_PHOTOS = 30;

/**
 * Every photo from the last 24 hours is always kept; older ones stay too, newest first, up to
 * MAX_KEPT_PHOTOS. Beyond that an old post keeps its caption and place but not its photo.
 */
export function keepRecentPhotos(posts: DemoPost[], now = Date.now()): DemoPost[] {
  let kept = 0;
  return posts.map((p) => {
    if (!p.photoUri) return p;
    kept += 1;
    const fresh = now - Date.parse(p.at) < 24 * 3_600_000;
    return fresh || kept <= MAX_KEPT_PHOTOS ? p : { ...p, photoUri: undefined };
  });
}

function demoIsPrivate(id: string) {
  return DEMO_USERS.find((u) => u.id === id)?.isPrivate ?? true;
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      ...initial,
      completeOnboarding: (profile) => set({ onboarded: true, profile }),
      updateProfile: (patch) =>
        set((s) => ({ profile: s.profile ? { ...s.profile, ...patch } : s.profile })),
      recordVisit: (place, places) => {
        const s = get();
        const now = new Date();
        const today = lisbonDate(now);
        const beacons = s.friendChallenges
          .filter(
            (c) =>
              c.direction === 'incoming' &&
              c.placeId === place.id &&
              c.beaconDate === today &&
              effectiveStatus(c, s.unlocked) !== 'completed' &&
              c.status !== 'declined',
          )
          .map((c) => c.id);
        const r = applyVisit(progressOf(s), place, places, now, {
          timeKey: isBoostActive(s.inventory.activeUntil, TIME_KEY_CODE, now.getTime()),
          beacons,
        });
        if (!r) return null;

        // First discovery in a city collects its stamp, in gold if you hold stamp ink.
        const regionOf = (p: Place | undefined) => p && (p.region ?? regionFor(p)?.slug);
        const region = regionOf(place);
        const known = [...places, ...DEMO_PLACES];
        const collected =
          !region ||
          !!s.stamps[region] ||
          Object.keys(s.unlocked).some((id) => regionOf(known.find((p) => p.id === id)) === region);
        if (collected) {
          set({ ...r.progress, justUnlocked: place.id });
          return r.result;
        }
        const gold = !!s.inventory.owned[STAMP_INK_CODE];
        const owned = { ...s.inventory.owned };
        delete owned[STAMP_INK_CODE];
        set({
          ...r.progress,
          justUnlocked: place.id,
          stamps: { ...s.stamps, [region]: { at: now.toISOString(), gold } },
          inventory: { ...s.inventory, owned },
        });
        return { ...r.result, stamp: { region, gold } };
      },
      completeChallenge: (qualifying, challengeId, places) => {
        const r = applyDailyChallenge(
          progressOf(get()),
          qualifying,
          challengeId,
          places,
          new Date(),
        );
        set(r.progress);
        return r.bonus;
      },
      setChallenge: (challenge) => set({ challenge }),
      setTeleport: (teleport) => set({ teleport }),
      clearJustUnlocked: () => set({ justUnlocked: null }),
      toggleFollow: (id) =>
        set((s) => ({
          following: s.following.includes(id)
            ? s.following.filter((x) => x !== id)
            : [...s.following, id],
        })),
      toggleLike: (id) =>
        set((s) => {
          const liked = { ...s.liked };
          if (liked[id]) delete liked[id];
          else liked[id] = true;
          return { liked };
        }),
      addPost: (post) => set((s) => ({ posts: keepRecentPhotos([post, ...s.posts]) })),
      block: (id) =>
        set((s) => {
          const friends = { ...s.friends };
          delete friends[id];
          return {
            blocked: [...new Set([...s.blocked, id])],
            following: s.following.filter((x) => x !== id),
            friends,
            friendChallenges: s.friendChallenges.map((c) =>
              c.friendId === id && c.status === 'pending' ? { ...c, status: 'declined' } : c,
            ),
          };
        }),
      reveal: (placeId) =>
        set((s) =>
          s.revealed[placeId]
            ? {}
            : {
                revealed: { ...s.revealed, [placeId]: new Date().toISOString() },
                justRevealed: placeId,
              },
        ),
      clearJustRevealed: () => set({ justRevealed: null }),
      setLastRegion: (lastRegion) => set({ lastRegion }),
      startFlight: (flight) => set({ flight }),
      endFlight: () => set((s) => ({ flight: null, landedAt: s.landedAt + 1 })),
      setBrowse: (browse) => set({ browse }),
      sendFriendRequest: (id) => {
        const current = get().friends[id];
        // Like send_friend_request(): answering their pending request makes you friends.
        // Demo explorers with public profiles say yes straight away so the flow can be tried.
        const next: FriendStatus =
          current === 'friends' || current === 'incoming' || !demoIsPrivate(id)
            ? 'friends'
            : 'outgoing';
        set((s) => ({ friends: { ...s.friends, [id]: next } }));
        return next;
      },
      respondFriendRequest: (id, accept) =>
        set((s) => {
          if (s.friends[id] !== 'incoming') return {};
          const friends = { ...s.friends };
          if (accept) friends[id] = 'friends';
          else delete friends[id];
          return { friends };
        }),
      removeFriend: (id) =>
        set((s) => {
          const friends = { ...s.friends };
          delete friends[id];
          return { friends };
        }),
      challengeFriend: (friendId, placeId, note) => {
        const existing = get().friendChallenges.find(
          (c) =>
            c.direction === 'outgoing' &&
            c.friendId === friendId &&
            c.placeId === placeId &&
            (c.status === 'pending' || c.status === 'accepted'),
        );
        if (existing) return existing.id;
        const id = `demo-fc-${Date.now().toString(36)}`;
        set((s) => ({
          friendChallenges: [
            {
              id,
              friendId,
              direction: 'outgoing',
              placeId,
              note: note?.trim() || null,
              status: 'pending',
              createdAt: new Date().toISOString(),
            },
            ...s.friendChallenges,
          ],
        }));
        return id;
      },
      respondFriendChallenge: (id, accept) =>
        set((s) => ({
          friendChallenges: s.friendChallenges.map((c) =>
            c.id === id && c.direction === 'incoming' && c.status === 'pending'
              ? { ...c, status: accept ? 'accepted' : 'declined' }
              : c,
          ),
        })),
      lightBeacon: (id) => {
        const s = get();
        const c = s.friendChallenges.find((x) => x.id === id);
        const open =
          c &&
          !c.beaconDate &&
          (c.status === 'pending' || c.status === 'accepted') &&
          effectiveStatus(c, s.unlocked) !== 'completed';
        if (!open) return 'challenge_not_found';
        if (!s.inventory.owned[FRIEND_BEACON_CODE]) return 'no_beacon';
        const owned = { ...s.inventory.owned };
        delete owned[FRIEND_BEACON_CODE];
        const today = lisbonDate(new Date());
        set({
          inventory: { ...s.inventory, owned },
          friendChallenges: s.friendChallenges.map((x) =>
            x.id === id ? { ...x, beaconDate: today } : x,
          ),
        });
        return null;
      },
      report: (r) =>
        set((s) => ({ reports: [...s.reports, { ...r, at: new Date().toISOString() }] })),
      addSubmission: (sub) => set((s) => ({ submissions: [sub, ...s.submissions] })),
      reviewSubmission: (id, approve) =>
        set((s) => ({
          submissions: s.submissions.map((x) =>
            x.id === id ? { ...x, status: approve ? 'approved' : 'rejected' } : x,
          ),
        })),
      buy: (code, price, durationMinutes) => {
        const s = get();
        const next = applyPurchase(progressOf(s), code, price, new Date());
        if (!next) return false;
        const inv = {
          ...s.inventory,
          owned: { ...s.inventory.owned },
          activeUntil: { ...s.inventory.activeUntil },
        };
        if (durationMinutes) {
          const base = Math.max(Date.now(), Date.parse(inv.activeUntil[code] ?? '') || 0);
          inv.activeUntil[code] = new Date(base + durationMinutes * 60_000).toISOString();
        } else {
          inv.owned[code] = new Date().toISOString();
        }
        set({ ...next, inventory: inv });
        return true;
      },
      equip: (slot, code) =>
        set((s) => ({
          inventory: { ...s.inventory, equipped: { ...s.inventory.equipped, [slot]: code } },
        })),
      setDemoModerator: (demoModerator) => set({ demoModerator }),
      dismissInstallPrompt: () => set({ installPromptDismissed: true }),
      setPref: (key, value) => set((s) => ({ prefs: { ...s.prefs, [key]: value } })),
      setTheme: (theme) => set((s) => ({ prefs: { ...s.prefs, theme } })),
      reset: () => set({ ...initial, friendChallenges: initialFriendChallenges() }),
    }),
    {
      name: 'wandro-session',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({
        justUnlocked: _j,
        justRevealed: _r,
        browse: _b,
        flight: _f,
        landedAt: _l,
        ...rest
      }) => rest,
      // v1 kept coins in `unlocked[].points` and `bonusPoints`; rebuild a ledger from them.
      migrate: (persisted, version) => {
        const old = (persisted ?? {}) as Record<string, unknown>;
        if (version < 2) {
          const unlocked = (old.unlocked ?? {}) as Record<string, { at: string; points: number }>;
          const ledger: LedgerEntry[] = Object.entries(unlocked).map(([ref, u]) => ({
            kind: 'visit',
            coins: u.points,
            xp: u.points,
            at: u.at,
            ref,
          }));
          const bonus = Number(old.bonusPoints ?? 0);
          if (bonus)
            ledger.push({
              kind: 'daily_challenge',
              coins: bonus,
              xp: bonus,
              at: new Date().toISOString(),
              ref: 'legacy',
            });
          const upgraded: Record<string, DemoUnlock> = {};
          for (const [id, u] of Object.entries(unlocked)) {
            upgraded[id] = {
              at: u.at,
              points: u.points,
              visitorsBefore: 0,
              firstDiscoverer: false,
            };
          }
          Object.assign(old, { ...initial, ...old, unlocked: upgraded, ledger });
        }
        // v2 kept the picked photo's temporary URL, which is dead after a reload or a new
        // deploy; posts now store the photo itself (keepPhoto). Drop the dead links.
        if (version < 3 && Array.isArray(old.posts)) {
          old.posts = (old.posts as DemoPost[]).map((p) =>
            p.photoUri && !p.photoUri.startsWith('data:') && !p.photoUri.startsWith('file:')
              ? { ...p, photoUri: undefined }
              : p,
          );
        }
        return old as unknown as SessionState;
      },
    },
  ),
);
