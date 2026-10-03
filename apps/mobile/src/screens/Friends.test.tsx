import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { DEMO_PLACES } from '@wandro/shared';
import type { ReactNode } from 'react';
import ChallengeFriend from '../../app/challenge/[id]';
import Friends from '../../app/friends';
import { FriendChallengeCard } from '@/components/FriendChallengeCard';
import { useFriendChallenges } from '@/data/friends';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

const mockBack = jest.fn();
const mockPush = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: {
    back: () => mockBack(),
    push: (...a: unknown[]) => mockPush(...a),
    canGoBack: () => true,
  },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
  watchPositionAsync: jest.fn(),
  Accuracy: { High: 4 },
}));

const wrapper = queryWrapper();

function IncomingChallenge({ id }: { id: string }) {
  const x = useFriendChallenges().find((c) => c.id === id);
  return x ? <FriendChallengeCard challenge={x} /> : null;
}

beforeEach(() => {
  useSession.getState().reset();
  useSession
    .getState()
    .completeOnboarding({ username: 'filippo', homeCity: 'Sintra', explorerStyles: ['nature'] });
  mockParams = {};
  jest.clearAllMocks();
});

describe('Friends', () => {
  it('accepts an incoming friend request', async () => {
    await render(<Friends />, { wrapper });
    expect(screen.getByText('Friend requests (1)')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('accept-demo-user-sofia'));
    expect(useSession.getState().friends['demo-user-sofia']).toBe('friends');
    expect(screen.getByText('Your friends (3)')).toBeOnTheScreen();
  });

  it('finds an explorer and sends a friend request', async () => {
    await render(<Friends />, { wrapper });
    await fireEvent.changeText(screen.getByTestId('friend-search'), 'tomas');
    await fireEvent.press(screen.getByTestId('friend-button-demo-user-tomas'));
    // Public demo explorers say yes straight away.
    expect(useSession.getState().friends['demo-user-tomas']).toBe('friends');
  });

  it('a private explorer stays "requested" until they answer, and the request can be cancelled', async () => {
    await render(<Friends />, { wrapper });
    await fireEvent.changeText(screen.getByTestId('friend-search'), 'joao');
    await fireEvent.press(screen.getByTestId('friend-button-demo-user-joao'));
    expect(useSession.getState().friends['demo-user-joao']).toBe('outgoing');
    await fireEvent.press(screen.getAllByTestId('friend-button-demo-user-joao')[0]!);
    expect(useSession.getState().friends['demo-user-joao']).toBeUndefined();
  });
});

describe('Challenge a friend', () => {
  it('sends a place with an idea', async () => {
    mockParams = { id: 'demo-user-ines' };
    await render(<ChallengeFriend />, { wrapper });
    expect(screen.getByTestId('send-challenge')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('pick-demo-pena'));
    await fireEvent.changeText(screen.getByTestId('challenge-note'), 'Sunrise from the terrace!');
    await fireEvent.press(screen.getByTestId('send-challenge'));

    const sent = useSession.getState().friendChallenges.find((c) => c.direction === 'outgoing');
    expect(sent).toMatchObject({
      friendId: 'demo-user-ines',
      placeId: 'demo-pena',
      note: 'Sunrise from the terrace!',
      status: 'pending',
    });
    expect(mockBack).toHaveBeenCalled();
  });

  it('never offers hidden gems', async () => {
    mockParams = { id: 'demo-user-ines' };
    await render(<ChallengeFriend />, { wrapper });
    expect(screen.queryByTestId('pick-demo-sintra-fonte-mourisca')).toBeNull();
  });

  it('only friends can be challenged', async () => {
    mockParams = { id: 'demo-user-tomas' };
    await render(<ChallengeFriend />, { wrapper });
    expect(screen.getByText('You can only challenge friends.')).toBeOnTheScreen();
  });
});

describe('FriendChallengeCard', () => {
  it('accepts a challenge and completes it when the place is discovered', async () => {
    await render(<IncomingChallenge id="demo-fc-1" />, { wrapper });
    await fireEvent.press(screen.getByTestId('accept-challenge-demo-fc-1'));
    expect(screen.getByText('On your list · go find it')).toBeOnTheScreen();

    const regaleira = DEMO_PLACES.find((p) => p.id === 'demo-regaleira')!;
    await act(() => {
      useSession.getState().recordVisit(regaleira, DEMO_PLACES);
    });
    expect(screen.getByText('Found it! ✓')).toBeOnTheScreen();
  });

  it('reports a note, which hides it', async () => {
    await render(
      <FriendChallengeCard
        challenge={{
          id: 'demo-fc-1',
          direction: 'incoming',
          friendId: 'demo-user-ines',
          friendUsername: 'ines.wanders',
          place: {
            id: 'demo-regaleira',
            name: 'Quinta da Regaleira',
            category: 'heritage',
            lat: 0,
            lng: 0,
          },
          note: 'Hello',
          status: 'pending',
          createdAt: new Date().toISOString(),
        }}
      />,
      { wrapper },
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Report this note' }));
    expect(useSession.getState().reports).toEqual([
      expect.objectContaining({ targetType: 'friend_challenge', targetId: 'demo-fc-1' }),
    ]);
  });
});
