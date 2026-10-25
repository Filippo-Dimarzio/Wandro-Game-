import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { router } from 'expo-router';
import TrailScreen from '../../app/trail/[slug]';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({ slug: 'sintra-magpies-millionaire' }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));

const wrapper = queryWrapper();
const unlock = (id: string) =>
  useSession.setState((s) => ({
    unlocked: {
      ...s.unlocked,
      [id]: { at: new Date().toISOString(), points: 80, visitorsBefore: 3, firstDiscoverer: false },
    },
  }));

describe('Trail screen', () => {
  beforeEach(() => useSession.getState().reset());

  it('starts, guides you to an undiscovered stop, then takes hints and answers', async () => {
    await render(<TrailScreen />, { wrapper });
    expect(screen.getByText('Kings, Magpies and a Millionaire')).toBeTruthy();
    expect(screen.queryByTestId('trail-guide')).toBeNull();

    await fireEvent.press(screen.getByTestId('trail-start'));
    expect(useSession.getState().trails['sintra-magpies-millionaire']).toBeDefined();
    await fireEvent.press(await screen.findByTestId('trail-guide'));
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(tabs)/explore',
        params: expect.objectContaining({ place: 'demo-sintra-santa-maria', guide: '1' }),
      }),
    );

    unlock('demo-sintra-santa-maria');
    await fireEvent.press(await screen.findByTestId('trail-hint'));
    expect(await screen.findByText(/Count the rows/)).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('trail-answer'), '4');
    await fireEvent.press(screen.getByTestId('trail-check'));
    expect((await screen.findByTestId('trail-feedback')).props.children).toMatch(/Not quite/);

    await fireEvent.changeText(screen.getByTestId('trail-answer'), '3');
    await fireEvent.press(screen.getByTestId('trail-check'));
    expect(await screen.findByText('Solved · +10 coins')).toBeTruthy();
    const coins = useSession
      .getState()
      .ledger.filter((e) => e.kind === 'trail_stop')
      .reduce((s, e) => s + e.coins, 0);
    expect(coins).toBe(10);
  });

  it('answers a multiple-choice clue', async () => {
    useSession.getState().startTrail('sintra-magpies-millionaire');
    unlock('demo-sintra-santa-maria');
    useSession.getState().answerTrailClue('sintra-magpies-millionaire', 1, '3');
    unlock('demo-sintra-national-palace');
    await render(<TrailScreen />, { wrapper });
    await fireEvent.press(screen.getByTestId('trail-choice-Por bem'));
    // Both clean stops so far paid the full 20.
    expect(await screen.findAllByText('Solved · +20 coins')).toHaveLength(2);
    expect(screen.getByTestId('trail-stop-3')).toBeTruthy();
  });
});
