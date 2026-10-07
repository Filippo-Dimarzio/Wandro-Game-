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

const textOf = (n: { props: { children?: unknown } }): string =>
  ([] as unknown[]).concat(n.props.children).join('');

describe('Leaderboard', () => {
  beforeEach(() => {
    useSession.getState().reset();
    useSession
      .getState()
      .completeOnboarding({ username: 'me', homeCity: 'Sintra', explorerStyles: [] });
  });

  it('opens on one Portugal board ranked by XP, with no global or weekly boards', async () => {
    for (const p of DEMO_PLACES.filter((x) => !x.hidden).slice(0, 40))
      useSession.getState().recordVisit(p, DEMO_PLACES);
    await render(<Leaderboard />, { wrapper: queryWrapper() });
    expect(screen.getByRole('tab', { name: /Portugal/ })).toBeSelected();
    expect(screen.queryByRole('tab', { name: /Global/ })).toBeNull();
    expect(screen.queryByRole('tab', { name: /This week/ })).toBeNull();
    const xp = screen
      .getAllByTestId('row-xp')
      .map((n) => Number(/([\d,]+) XP/.exec(textOf(n))![1]!.replace(',', '')));
    expect(xp).toEqual([...xp].sort((a, b) => b - a));
    expect(screen.getByLabelText(/^1\. me, 2000 XP, 40 challenges$/)).toBeOnTheScreen();
  });

  it('the Cities board ranks by XP earned in the chosen city', async () => {
    for (const p of DEMO_PLACES.filter((x) => x.region === 'evora' && !x.hidden).slice(0, 9))
      useSession.getState().recordVisit(p, DEMO_PLACES);
    await render(<Leaderboard />, { wrapper: queryWrapper() });
    await fireEvent.press(screen.getByRole('tab', { name: /Cities/ }));
    await fireEvent.press(screen.getByTestId('board-city-evora'));
    expect(screen.getByText(/Ranked by XP earned in Évora/)).toBeOnTheScreen();
    expect(screen.getAllByTestId('row-xp')[0]!).toHaveTextContent(/450 XP/);
    expect(screen.getAllByTestId('row-challenges')[0]!).toHaveTextContent(/9 challenges/);
  });
});
