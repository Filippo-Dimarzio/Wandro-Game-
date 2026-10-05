import { render, renderHook, screen } from '@testing-library/react-native';
import { PhotoLibrary } from './PhotoLibrary';
import { useFeed } from '@/data/social';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const photo = 'data:image/jpeg;base64,AAA';
const post = (id: string, hoursAgo: number) => ({
  id,
  placeId: 'demo-pena',
  caption: id,
  photoUri: photo,
  at: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
});

describe('photo library', () => {
  beforeEach(() => useSession.getState().reset());

  it('keeps every posted photo for good, while Moments shows it for 24 hours', async () => {
    useSession.getState().addPost(post('today', 2));
    useSession.getState().addPost(post('last-week', 24 * 7));
    const wrapper = queryWrapper();
    const feed = (await renderHook(() => useFeed(), { wrapper })).result.current;
    expect(feed.items.map((i) => i.id)).toEqual(['today']);

    await render(<PhotoLibrary />, { wrapper });
    expect(screen.getAllByTestId('library-photo')).toHaveLength(2);
  });

  it('shows no one else’s made-up photos', async () => {
    useSession.getState().addPost(post('mine', 1));
    const feed = (await renderHook(() => useFeed(), { wrapper: queryWrapper() })).result.current;
    expect(feed.items.every((i) => i.isMine)).toBe(true);
  });
});
