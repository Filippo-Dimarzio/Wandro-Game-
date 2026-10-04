import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { DEMO_PLACES } from '@wandro/shared';
import Shop from '../../app/shop';
import { FriendChallengeCard } from '@/components/FriendChallengeCard';
import { TimeQuestBadge } from '@/components/TimeQuestBadge';
import { useFriendChallenges } from '@/data/friends';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn(), canGoBack: () => true },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));

const wrapper = queryWrapper();
const byId = (id: string) => DEMO_PLACES.find((p) => p.id === id)!;

function Challenge({ id }: { id: string }) {
  const x = useFriendChallenges().find((c) => c.id === id);
  return x ? <FriendChallengeCard challenge={x} /> : null;
}

describe('boosts in the app (demo mode)', () => {
  beforeEach(() => {
    useSession.getState().reset();
    useSession.getState().recordVisit(byId('demo-music'), DEMO_PLACES); // 570 coins
  });

  it('a one-use boost shows as ready once bought, and can’t be bought twice', async () => {
    await render(<Shop />, { wrapper });
    fireEvent.press(screen.getByTestId('buy-stamp_ink'));
    expect(await screen.findByTestId('held-stamp_ink')).toHaveTextContent('Ready to use');
    expect(screen.queryByTestId('buy-stamp_ink')).toBeNull();
  });

  it('shows a place’s night quest and asks for the key', async () => {
    await render(<TimeQuestBadge place={byId('demo-evora-roman-temple')} />, { wrapper });
    expect(screen.getByTestId('time-quest')).toHaveTextContent(/Night quest · \d\d:\d\d–05:00/);
    expect(screen.getByText(/Needs a Time-of-day key/)).toBeOnTheScreen();
    await act(async () => void useSession.getState().buy('time_key', 200, 1440));
    expect(screen.queryByText(/Needs a Time-of-day key/)).toBeNull();
  });

  it('places without a time quest show nothing', async () => {
    await render(<TimeQuestBadge place={byId('demo-pena')} />, { wrapper });
    expect(screen.queryByTestId('time-quest')).toBeNull();
  });

  it('lights a friend beacon on a challenge', async () => {
    await render(<Challenge id="demo-fc-1" />, { wrapper });
    expect(screen.queryByTestId('light-beacon-demo-fc-1')).toBeNull();
    await act(async () => void useSession.getState().buy('friend_beacon', 150));
    fireEvent.press(screen.getByTestId('light-beacon-demo-fc-1'));
    expect(await screen.findByTestId('beacon-lit-demo-fc-1')).toBeOnTheScreen();
    expect(screen.queryByTestId('light-beacon-demo-fc-1')).toBeNull();
  });
});
