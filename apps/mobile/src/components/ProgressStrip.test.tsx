import { render, screen } from '@testing-library/react-native';
import { ProgressStrip } from '@/components/ProgressStrip';
import type { Wallet } from '@/data/wallet';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const wallet = (xp: number): Wallet => ({
  coins: 900,
  coinsEarned: 900,
  xp,
  level: 1,
  streak: 3,
  lastActiveDate: null,
  discoveries: 7,
});

describe('ProgressStrip', () => {
  it('shows only the level, its rank and the XP, without the old extra lines', async () => {
    await render(<ProgressStrip wallet={wallet(0)} />);
    expect(screen.getByText('Level 1 · Wanderer')).toBeOnTheScreen();
    expect(screen.getByTestId('xp-count')).toHaveTextContent('0/250 XP');
    expect(screen.queryByText(/discover/)).toBeNull();
    expect(screen.queryByText(/coins/i)).toBeNull();
    expect(screen.queryByTestId('xp-explainer')).toBeNull();
  });

  it('fills the bar as you earn XP, and starts again on the next level', async () => {
    const r = await render(<ProgressStrip wallet={wallet(150)} />);
    expect(screen.getByTestId('xp-bar')).toHaveAccessibilityValue({ min: 0, max: 250, now: 150 });
    await r.rerender(<ProgressStrip wallet={wallet(300)} />);
    expect(screen.getByText('Level 2 · Wanderer')).toBeOnTheScreen();
    expect(screen.getByTestId('xp-bar')).toHaveAccessibilityValue({ min: 0, max: 500, now: 50 });
  });
});
