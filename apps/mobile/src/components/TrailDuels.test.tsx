import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import TrailScreen from '../../app/trail/[slug]';
import { TrailDuelCard } from '@/components/TrailDuels';
import { useTrailDuels } from '@/data/trailDuels';
import { useSession } from '@/state/session';
import { grantCoins } from '@/test/grantCoins';
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
const STOPS = [
  'demo-sintra-santa-maria',
  'demo-sintra-national-palace',
  'demo-regaleira',
  'demo-seteais',
  'demo-pena',
];
const discover = () =>
  useSession.setState((s) => ({
    unlocked: Object.fromEntries(
      STOPS.map((id) => [
        id,
        { at: new Date().toISOString(), points: 50, visitorsBefore: 3, firstDiscoverer: false },
      ]),
    ),
    ledger: s.ledger,
  }));

function Duels() {
  const duels = useTrailDuels();
  return (
    <>
      {duels.map((d) => (
        <TrailDuelCard key={d.id} duel={d} />
      ))}
    </>
  );
}

describe('Trail duels', () => {
  beforeEach(() => useSession.getState().reset());

  it('challenges a friend from an unlocked trail and settles when you finish', async () => {
    discover();
    grantCoins(300);
    useSession.getState().startTrail('sintra-magpies-millionaire');
    await render(<TrailScreen />, { wrapper });
    expect(screen.getByText(/Challenge a friend/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('duel-challenge-demo-user-ines'));
    expect(await screen.findByText('ines.wanders: 4 of 4 stops solved')).toBeTruthy();

    const s = useSession.getState();
    for (const [i, a] of ['3', 'Por bem', '9', 'Pena Palace'].entries())
      s.answerTrailClue('sintra-magpies-millionaire', i + 1, a);
    // A clean run (80) beats the scripted friend (65): +25 for finishing, +25 for winning.
    expect(await screen.findByText('You won, 80 to 65 · +50 coins')).toBeTruthy();
    const paid = useSession
      .getState()
      .ledger.filter((e) => e.kind === 'trail_duel')
      .map((e) => e.coins);
    expect(paid).toEqual([50]);
  });

  it('accepts or declines a duel a friend sent you', async () => {
    await render(<Duels />, { wrapper });
    expect(screen.getByText(/challenged you/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('duel-accept-demo-duel-1'));
    expect(useSession.getState().trailDuels[0]!.status).toBe('accepted');
    expect(await screen.findByText(/stops solved/)).toBeTruthy();
  });
});
