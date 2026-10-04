// Demo mirror of the friends migration: mutual friend requests and place challenges with a note.
// The rules match supabase/migrations/20261005100000_friends.sql.
import { FRIEND_CHALLENGES_PER_DAY, FRIEND_NOTE_MAX } from '@wandro/shared';

/** From the player's side: 'incoming' = they asked you, 'outgoing' = you asked them. */
export type FriendStatus = 'friends' | 'incoming' | 'outgoing';

export type FriendChallengeStatus = 'pending' | 'accepted' | 'declined' | 'completed';

export interface DemoFriendChallenge {
  id: string;
  /** The other player: sender for incoming challenges, recipient for outgoing ones. */
  friendId: string;
  direction: 'incoming' | 'outgoing';
  placeId: string;
  note: string | null;
  status: FriendChallengeStatus;
  createdAt: string;
}

export const INITIAL_FRIENDS: Record<string, FriendStatus> = {
  'demo-user-ines': 'friends',
  'demo-user-mia': 'friends',
  'demo-user-sofia': 'incoming',
};

export function initialFriendChallenges(now = new Date()): DemoFriendChallenge[] {
  const ago = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();
  return [
    {
      id: 'demo-fc-1',
      friendId: 'demo-user-ines',
      direction: 'incoming',
      placeId: 'demo-regaleira',
      note: 'Walk down the initiation well at golden hour. The light is unreal!',
      status: 'pending',
      createdAt: ago(3),
    },
    {
      id: 'demo-fc-2',
      friendId: 'demo-user-mia',
      direction: 'incoming',
      placeId: 'demo-aveiro-moliceiro-ride',
      note: 'If you ever come to Aveiro: take a moliceiro along the canals 🛶',
      status: 'pending',
      createdAt: ago(26),
    },
  ];
}

export type FriendChallengeError =
  'not_friends' | 'note_too_long' | 'already_discovered' | 'rate_limited' | 'place_not_active';

/** Same checks as challenge_friend(); returns an error code or null when it may be sent. */
export function friendChallengeError(input: {
  friendStatus: FriendStatus | undefined;
  note: string;
  placeHidden: boolean;
  sentToday: number;
}): FriendChallengeError | null {
  if (input.friendStatus !== 'friends') return 'not_friends';
  if (input.placeHidden) return 'place_not_active';
  if (input.note.trim().length > FRIEND_NOTE_MAX) return 'note_too_long';
  if (input.sentToday >= FRIEND_CHALLENGES_PER_DAY) return 'rate_limited';
  return null;
}

/** An accepted challenge is completed once the recipient discovers the place (server: visits trigger). */
export function effectiveStatus(
  c: DemoFriendChallenge,
  unlocked: Record<string, unknown>,
): FriendChallengeStatus {
  if (
    c.direction === 'incoming' &&
    (c.status === 'accepted' || c.status === 'pending') &&
    unlocked[c.placeId]
  )
    return 'completed';
  return c.status;
}
