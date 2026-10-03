import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useSession } from '@/state/session';
import { useFeed, useLeaderboard, useToggleLike } from './social';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('social (demo mode)', () => {
  beforeEach(() => useSession.getState().reset());

  it('shows posts from followed explorers, newest first', async () => {
    const { result } = await renderHook(() => useFeed(), { wrapper });
    const users = new Set(result.current.items.map((i) => i.userId));
    expect([...users].sort()).toEqual(['demo-user-ines', 'demo-user-tomas']);
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
    const target = result.current.items[0].id;
    await act(async () =>
      useSession.getState().report({ targetType: 'post', targetId: target, reason: 'spam' }),
    );
    expect(result.current.items.some((i) => i.id === target)).toBe(false);
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
