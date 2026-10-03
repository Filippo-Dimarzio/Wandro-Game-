import { effectiveStatus, friendChallengeError, initialFriendChallenges } from './friends';
import { useSession } from '@/state/session';

describe('demo friends rules (mirror challenge_friend)', () => {
  const ok = { friendStatus: 'friends' as const, note: 'hi', placeHidden: false, sentToday: 0 };

  it('matches the server checks', () => {
    expect(friendChallengeError(ok)).toBeNull();
    expect(friendChallengeError({ ...ok, friendStatus: 'outgoing' })).toBe('not_friends');
    expect(friendChallengeError({ ...ok, placeHidden: true })).toBe('place_not_active');
    expect(friendChallengeError({ ...ok, note: 'x'.repeat(281) })).toBe('note_too_long');
    expect(friendChallengeError({ ...ok, sentToday: 20 })).toBe('rate_limited');
  });

  it('completes accepted challenges once the place is discovered', () => {
    const [c] = initialFriendChallenges();
    expect(effectiveStatus(c!, {})).toBe('pending');
    expect(effectiveStatus({ ...c!, status: 'accepted' }, { [c!.placeId]: {} })).toBe('completed');
    expect(effectiveStatus({ ...c!, status: 'declined' }, { [c!.placeId]: {} })).toBe('declined');
  });
});

describe('session friends actions', () => {
  beforeEach(() => useSession.getState().reset());

  it('blocking someone ends the friendship and declines their open challenges', () => {
    useSession.getState().block('demo-user-ines');
    const s = useSession.getState();
    expect(s.friends['demo-user-ines']).toBeUndefined();
    expect(s.friendChallenges.find((c) => c.id === 'demo-fc-1')?.status).toBe('declined');
  });

  it('sending the same challenge twice keeps one', () => {
    const a = useSession.getState().challengeFriend('demo-user-mia', 'demo-pena', 'go!');
    const b = useSession.getState().challengeFriend('demo-user-mia', 'demo-pena', 'again');
    expect(a).toBe(b);
  });

  it('asking someone who asked you makes you friends', () => {
    expect(useSession.getState().sendFriendRequest('demo-user-sofia')).toBe('friends');
  });
});
