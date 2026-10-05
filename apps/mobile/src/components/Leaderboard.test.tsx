import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { DEMO_PLACES } from '@wandro/shared';
import Leaderboard from '../../app/leaderboard';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));

describe('Leaderboard', () => {
  beforeEach(() => {
    useSession.getState().reset();
    useSession
      .getState()
      .completeOnboarding({ username: 'me', homeCity: 'Sintra', explorerStyles: [] });
  });

  it('the Cities board ranks by challenges completed in the chosen city', async () => {
    for (const p of DEMO_PLACES.filter((x) => x.region === 'evora' && !x.hidden).slice(0, 9))
      useSession.getState().recordVisit(p, DEMO_PLACES);
    await render(<Leaderboard />, { wrapper: queryWrapper() });
    await fireEvent.press(screen.getByRole('tab', { name: /Cities/ }));
    await fireEvent.press(screen.getByTestId('board-city-evora'));
    expect(screen.getByText('Ranked by challenges completed in Évora.')).toBeOnTheScreen();
    const first = screen.getAllByTestId('row-challenges')[0]!;
    expect(first).toHaveTextContent(/9 challenges/);
  });
});
