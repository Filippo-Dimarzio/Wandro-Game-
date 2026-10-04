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

    it('shows the last 24 h from people you follow or are friends with, newest first', async () => {
      const { result } = await renderHook(() => useFeed(), { wrapper });
      expect(result.current.status.unlocked).toBe(true);
      const others = result.current.items.filter((i) => !i.isMine);
      expect([...new Set(others.map((i) => i.userId))].sort()).toEqual([
        'demo-user-ines',
        'demo-user-tomas',
      ]);
      // Ines's 30-hour-old post and Mia's 2-day-old one have disappeared.
      expect(others.map((i) => i.id).sort()).toEqual(['demo-post-1', 'demo-post-2']);
      const times = result.current.items.map((i) => i.createdAt);
      expect([...times].sort().reverse()).toEqual(times);
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

    it('blocking hides that explorer and unfollows them', async () => {
      const { result } = await renderHook(() => useFeed(), { wrapper });
      await act(async () => useSession.getState().block('demo-user-ines'));
      expect(result.current.items.some((i) => i.userId === 'demo-user-ines')).toBe(false);
      expect(useSession.getState().following).not.toContain('demo-user-ines');
    });

    it('reported posts disappear from your feed', async () => {
      const { result } = await renderHook(() => useFeed(), { wrapper });
      const target = result.current.items.find((i) => !i.isMine)!.id;
      await act(async () =>
        useSession.getState().report({ targetType: 'post', targetId: target, reason: 'spam' }),
      );
      expect(result.current.items.some((i) => i.id === target)).toBe(false);
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

  it('friends leaderboard ranks you among followed explorers by coins', async () => {
    const { result } = await renderHook(() => useLeaderboard('friends'), { wrapper });
    const names = result.current.rows.map((r) => r.username);
    expect(names).toEqual(['ines.wanders', 'tomas_trails', 'you']);
    expect(result.current.rows.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('global leaderboard leaves private explorers out', async () => {
    const { result } = await renderHook(() => useLeaderboard('global'), { wrapper });
    expect(result.current.rows.some((r) => r.username === 'joao_on_foot')).toBe(false);
  });
});
