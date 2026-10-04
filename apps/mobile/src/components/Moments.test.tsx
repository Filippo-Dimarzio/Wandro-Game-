import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { DEMO_PLACES } from '@wandro/shared';
import { Moments } from './Moments';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a) } }));

const wrapper = queryWrapper();
const pena = DEMO_PLACES.find((p) => p.id === 'demo-pena')!;

describe('Moments', () => {
  beforeEach(() => {
    useSession.getState().reset();
    mockPush.mockClear();
  });

  it('stays locked until you discover a place and share it', async () => {
    await render(<Moments />, { wrapper });
    expect(screen.getByTestId('moments-locked')).toBeOnTheScreen();
    expect(screen.queryByTestId('share-moment')).toBeNull();
    expect(screen.queryAllByTestId('moment-tile')).toHaveLength(0);

    await act(async () => void useSession.getState().recordVisit(pena, DEMO_PLACES));
    await render(<Moments />, { wrapper });
    fireEvent.press(screen.getByTestId('share-moment'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/post/new',
      params: { place: 'demo-pena' },
    });
  });

  it('shows small boxes once you have shared, and opens one', async () => {
    useSession.getState().addPost({
      id: 'p1',
      placeId: 'demo-pena',
      caption: 'Me',
      at: new Date().toISOString(),
    });
    await render(<Moments />, { wrapper });
    const tiles = screen.getAllByTestId('moment-tile');
    expect(tiles).toHaveLength(3); // yours + Ines + Tomas from the last 24 h
    expect(screen.getByText('24 h left')).toBeOnTheScreen();
    fireEvent.press(tiles[1]);
    expect(await screen.findByTestId('feed-card')).toBeOnTheScreen();
  });
});
