import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { DEMO_PLACES } from '@wandro/shared';
import Shop from '../../app/shop';
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

describe('Store (demo mode)', () => {
  beforeEach(() => useSession.getState().reset());

  it('cannot buy without coins', async () => {
    await render(<Shop />, { wrapper });
    expect(screen.getByTestId('buy-incense_30')).toBeDisabled();
  });

  it('buys the incense trail with earned coins and starts the timer', async () => {
    useSession.getState().recordVisit(
      DEMO_PLACES.find((p) => p.id === 'demo-music')!,
      DEMO_PLACES,
    ); // 550 coins
    await render(<Shop />, { wrapper });
    await fireEvent.press(screen.getByTestId('buy-incense_30'));
    const s = useSession.getState();
    expect(Date.parse(s.inventory.activeUntil.incense_30)).toBeGreaterThan(
      Date.now() + 29 * 60_000,
    );
    expect(s.ledger.at(-1)).toMatchObject({ kind: 'purchase', coins: -150, xp: 0 });
    expect(screen.getByTestId('shop-message')).toHaveTextContent(/Enjoy your Incense trail/);
  });

  it('buys and wears a hat; cosmetics are bought once', async () => {
    useSession.getState().recordVisit(
      DEMO_PLACES.find((p) => p.id === 'demo-music')!,
      DEMO_PLACES,
    );
    await render(<Shop />, { wrapper });
    await fireEvent.press(screen.getByTestId('buy-hat_flower'));
    expect(useSession.getState().inventory.equipped.hat).toBe('hat_flower');
    expect(screen.queryByTestId('buy-hat_flower')).toBeNull();
  });
});
