import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import Profile from '../../app/(tabs)/profile';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/map/PlaceMap', () => ({ PlaceMap: () => null }));

describe('Profile', () => {
  jest.setTimeout(20_000);

  beforeEach(() => {
    useSession.getState().reset();
    useSession
      .getState()
      .completeOnboarding({ username: 'fil_dm7', homeCity: 'lisbon', explorerStyles: [] });
    jest.mocked(router.push).mockClear();
  });

  it('shows the home city as a chip with its flag', async () => {
    await render(<Profile />, { wrapper: queryWrapper() });
    expect(screen.getByTestId('home-city')).toHaveTextContent('🇵🇹Lisbon');
  });

  it('has a Customise button that opens the explorer customiser', async () => {
    await render(<Profile />, { wrapper: queryWrapper() });
    await fireEvent.press(screen.getByTestId('customise-button'));
    expect(router.push).toHaveBeenCalledWith('/customise');
  });

  it('no longer has Find explorers, Leaderboard or How to play buttons', async () => {
    await render(<Profile />, { wrapper: queryWrapper() });
    for (const name of ['Find explorers', 'Leaderboard', 'How to play'])
      expect(screen.queryByRole('button', { name })).toBeNull();
    expect(screen.getByRole('button', { name: 'Store' })).toBeOnTheScreen();
  });
});
