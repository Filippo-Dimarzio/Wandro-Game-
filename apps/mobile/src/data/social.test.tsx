import { act, renderHook } from '@testing-library/react-native';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';
import { useFeed, useLeaderboard, usePassport, useToggleLike } from './social';

const wrapper = queryWrapper();

describe('social (demo mode)', () => {
  const post = (hoursAgo = 0) =>
    useSession.getState().addPost({
      id: `post-${hoursAgo}`,
      placeId: 'demo-pena',
      caption: 'Me',
      at: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
    });

  beforeEach(() => useSession.getState().reset());

  it("keeps today's moments locked until you share one", async () => {
    const { result } = await renderHook(() => useFeed(), { wrapper });
    expect(result.current.status.unlocked).toBe(false);
    expect(result.current.items).toEqual([]);
  });

  describe('after sharing a moment', () => {
    beforeEach(() => post());

    it('shows your moment and no made-up posts from other players', async () => {
      const { result } = await renderHook(() => useFeed(), { wrapper });
      expect(result.current.status.unlocked).toBe(true);
      expect(result.current.items.length).toBeGreaterThan(0);
      expect(result.current.items.every((i) => i.isMine)).toBe(true);
    });

    it('likes and unlikes a post', async () => {
      const { result } = await renderHook(() => ({ feed: useFeed(), like: useToggleLike() }), {
        wrapper,
      });
      const first = result.current.feed.items[0];
      await act(async () => result.current.like.mutateAsync(first));
      expect(result.current.feed.items[0]).toMatchObject({
        likedByMe: true,
        likeCount: first.likeCount + 1,
      });
    });

    it('blocking someone unfollows them', async () => {
      await act(async () => useSession.getState().block('demo-user-ines'));
      expect(useSession.getState().following).not.toContain('demo-user-ines');
    });
  });

  it('old moments leave the feed but stay in your passport', async () => {
    post(30);
    const { result } = await renderHook(() => ({ feed: useFeed(), passport: usePassport() }), {
      wrapper,
    });
    expect(result.current.feed.status.unlocked).toBe(false);
    expect(result.current.feed.items).toEqual([]);
    expect(result.current.passport.stamps).toMatchObject([
      { placeName: 'Pena Palace', region: 'sintra' },
    ]);
  });

  it('friends leaderboard ranks you among followed explorers by XP', async () => {
    const { result } = await renderHook(() => useLeaderboard('friends'), { wrapper });
    const names = result.current.rows.map((r) => r.username);
    expect(names).toEqual(['ines.wanders', 'tomas_trails', 'you']);
    expect(result.current.rows.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('the Portugal leaderboard leaves private explorers out', async () => {
    const { result } = await renderHook(() => useLeaderboard('country'), { wrapper });
    expect(result.current.rows.some((r) => r.username === 'joao_on_foot')).toBe(false);
  });
});
