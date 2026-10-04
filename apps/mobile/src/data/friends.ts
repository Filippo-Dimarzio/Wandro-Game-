import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DEMO_PLACES, type Category } from '@wandro/shared';
import {
  effectiveStatus,
  friendChallengeError,
  type FriendChallengeStatus,
  type FriendStatus,
} from '@/demo/friends';
import { demoUser } from '@/demo/social';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';

export type { FriendChallengeStatus, FriendStatus } from '@/demo/friends';

export interface FriendView {
  id: string;
  username: string;
  level: number;
  homeCity: string | null;
}

export interface FriendsList {
  friends: FriendView[];
  incoming: FriendView[];
  outgoing: FriendView[];
}

export interface FriendChallengeView {
  id: string;
  direction: 'incoming' | 'outgoing';
  friendId: string;
  friendUsername: string;
  place: { id: string; name: string; category: Category; lat: number; lng: number };
  note: string | null;
  status: FriendChallengeStatus;
  createdAt: string;
  /** Lisbon day a friend beacon was lit on it. */
  beaconDate?: string;
}

const EMPTY: FriendsList = { friends: [], incoming: [], outgoing: [] };

function demoFriendView(id: string): FriendView | null {
  const u = demoUser(id);
  return u ? { id: u.id, username: u.username, level: u.level, homeCity: u.homeCity } : null;
}

type FriendRow = { id: string; username: string; level: number; home_city: string | null };
const toView = (r: FriendRow): FriendView => ({
  id: r.id,
  username: r.username,
  level: r.level,
  homeCity: r.home_city,
});

export function useFriends(): FriendsList & { isLoading: boolean } {
  const friends = useSession((s) => s.friends);
  const blocked = useSession((s) => s.blocked);
  const server = useQuery({
    queryKey: ['friends'],
    enabled: !isDemo,
    queryFn: async (): Promise<FriendsList> => {
      const { data, error } = await supabase!.rpc('my_friends');
      if (error) throw error;
      const d = data as Record<keyof FriendsList, FriendRow[]>;
      return {
        friends: d.friends.map(toView),
        incoming: d.incoming.map(toView),
        outgoing: d.outgoing.map(toView),
      };
    },
  });
  const demo = useMemo(() => {
    const pick = (status: FriendStatus) =>
      Object.entries(friends)
        .filter(([id, s]) => s === status && !blocked.includes(id))
        .flatMap(([id]) => demoFriendView(id) ?? []);
    return { friends: pick('friends'), incoming: pick('incoming'), outgoing: pick('outgoing') };
  }, [friends, blocked]);
  if (isDemo) return { ...demo, isLoading: false };
  return { ...(server.data ?? EMPTY), isLoading: server.isLoading };
}

/** Your relation to one player: friends, a request either way, or null. */
export function useFriendStatus(userId: string): FriendStatus | null {
  const demo = useSession((s) => s.friends[userId]);
  const server = useQuery({
    queryKey: ['friends', 'status', userId],
    enabled: !isDemo,
    queryFn: async () => {
      const { data, error } = await supabase!.rpc('friendship_with', { p_user: userId });
      if (error) throw error;
      return (data as FriendStatus | null) ?? null;
    },
  });
  return isDemo ? (demo ?? null) : (server.data ?? null);
}

function useInvalidateFriends() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['friends'] });
    qc.invalidateQueries({ queryKey: ['friend-challenges'] });
    qc.invalidateQueries({ queryKey: ['leaderboard'] });
    qc.invalidateQueries({ queryKey: ['feed'] });
  };
}

export function useSendFriendRequest() {
  const send = useSession((s) => s.sendFriendRequest);
  const onSuccess = useInvalidateFriends();
  return useMutation({
    mutationFn: async (userId: string): Promise<FriendStatus> => {
      if (isDemo) return send(userId);
      const { data, error } = await supabase!.rpc('send_friend_request', { p_user: userId });
      if (error) throw error;
      return data === 'accepted' ? 'friends' : 'outgoing';
    },
    onSuccess,
  });
}

export function useRespondFriendRequest() {
  const respond = useSession((s) => s.respondFriendRequest);
  const onSuccess = useInvalidateFriends();
  return useMutation({
    mutationFn: async ({ userId, accept }: { userId: string; accept: boolean }) => {
      if (isDemo) return respond(userId, accept);
      const { error } = await supabase!.rpc('respond_friend_request', {
        p_user: userId,
        p_accept: accept,
      });
      if (error) throw error;
    },
    onSuccess,
  });
}

export function useRemoveFriend() {
  const remove = useSession((s) => s.removeFriend);
  const onSuccess = useInvalidateFriends();
  return useMutation({
    mutationFn: async (userId: string) => {
      if (isDemo) return remove(userId);
      const { error } = await supabase!.rpc('remove_friend', { p_user: userId });
      if (error) throw error;
    },
    onSuccess,
  });
}

export function useFriendChallenges(): FriendChallengeView[] {
  const challenges = useSession((s) => s.friendChallenges);
  const unlocked = useSession((s) => s.unlocked);
  const blocked = useSession((s) => s.blocked);
  const reports = useSession((s) => s.reports);
  const server = useQuery({
    queryKey: ['friend-challenges'],
    enabled: !isDemo,
    queryFn: async (): Promise<FriendChallengeView[]> => {
      const { data, error } = await supabase!.rpc('my_friend_challenges');
      if (error) throw error;
      return (data as Record<string, unknown>[]).map((r) => ({
        id: r.id as string,
        direction: r.direction as FriendChallengeView['direction'],
        friendId: r.friend_id as string,
        friendUsername: r.friend_username as string,
        place: {
          id: r.place_id as string,
          name: r.place_name as string,
          category: r.category as Category,
          lat: r.lat as number,
          lng: r.lng as number,
        },
        note: (r.note as string | null) ?? null,
        status: r.status as FriendChallengeStatus,
        createdAt: r.created_at as string,
        beaconDate: (r.beacon_date as string | null) ?? undefined,
      }));
    },
  });
  const demo = useMemo(
    () =>
      challenges.flatMap((c): FriendChallengeView[] => {
        const u = demoUser(c.friendId);
        const p = DEMO_PLACES.find((x) => x.id === c.placeId);
        if (!u || !p || blocked.includes(c.friendId)) return [];
        return [
          {
            id: c.id,
            direction: c.direction,
            friendId: c.friendId,
            friendUsername: u.username,
            place: { id: p.id, name: p.name, category: p.category, lat: p.lat, lng: p.lng },
            // Like a moderator removing it, but only on this device: reported notes disappear.
            note: reports.some((r) => r.targetType === 'friend_challenge' && r.targetId === c.id)
              ? null
              : c.note,
            status: effectiveStatus(c, unlocked),
            createdAt: c.createdAt,
            beaconDate: c.beaconDate,
          },
        ];
      }),
    [challenges, unlocked, blocked, reports],
  );
  return isDemo ? demo : (server.data ?? []);
}

export const FRIEND_CHALLENGE_ERRORS = [
  'not_friends',
  'note_too_long',
  'already_discovered',
  'rate_limited',
  'place_not_active',
] as const;

export function useChallengeFriend() {
  const send = useSession((s) => s.challengeFriend);
  const onSuccess = useInvalidateFriends();
  return useMutation({
    mutationFn: async (input: { friendId: string; placeId: string; note: string }) => {
      if (isDemo) {
        const s = useSession.getState();
        const dayAgo = Date.now() - 86_400_000;
        const error = friendChallengeError({
          friendStatus: s.friends[input.friendId],
          note: input.note,
          placeHidden: !!DEMO_PLACES.find((p) => p.id === input.placeId)?.hidden,
          sentToday: s.friendChallenges.filter(
            (c) => c.direction === 'outgoing' && Date.parse(c.createdAt) > dayAgo,
          ).length,
        });
        if (error) throw new Error(error);
        return send(input.friendId, input.placeId, input.note);
      }
      const { data, error } = await supabase!.rpc('challenge_friend', {
        p_friend: input.friendId,
        p_place: input.placeId,
        p_note: input.note,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess,
  });
}

export function useRespondFriendChallenge() {
  const respond = useSession((s) => s.respondFriendChallenge);
  const onSuccess = useInvalidateFriends();
  return useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      if (isDemo) return respond(id, accept);
      const { error } = await supabase!.rpc('respond_friend_challenge', {
        p_id: id,
        p_accept: accept,
      });
      if (error) throw error;
    },
    onSuccess,
  });
}

export function useLightBeacon() {
  const light = useSession((s) => s.lightBeacon);
  const qc = useQueryClient();
  const onSuccess = useInvalidateFriends();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) {
        const error = light(id);
        if (error) throw new Error(error);
        return;
      }
      const { error } = await supabase!.rpc('light_beacon', { p_challenge: id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      return onSuccess();
    },
  });
}
