import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { DEMO_PLACES } from '@wandro/shared';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';
import { DailyChallengeCard } from './DailyChallengeCard';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const wrapper = queryWrapper();

describe('DailyChallengeCard (demo mode)', () => {
  beforeEach(() => useSession.getState().reset());

  it('stays locked until a matching place is discovered, then a hold claims double coins once', async () => {
    jest.useFakeTimers();
    await render(<DailyChallengeCard places={DEMO_PLACES} />, { wrapper });
    const button = screen.getByRole('button', { name: /confirm the daily challenge/i });
    expect(button).toBeDisabled();

    // Discover one place of every category so any rotation is satisfied.
    await act(async () => {
      const seen = new Set<string>();
      for (const p of DEMO_PLACES) {
        if (seen.has(p.category)) continue;
        seen.add(p.category);
        useSession.getState().recordVisit(p, DEMO_PLACES);
      }
    });
    expect(screen.getByRole('button', { name: /confirm the daily challenge/i })).toBeEnabled();

    await fireEvent(
      screen.getByRole('button', { name: /confirm the daily challenge/i }),
      'pressIn',
    );
    await act(async () => void jest.advanceTimersByTime(1000));

    expect(screen.getByText(/Completed/)).toBeOnTheScreen();
    const state = useSession.getState();
    const daily = state.ledger.filter((e) => e.kind === 'daily_challenge');
    expect(daily).toHaveLength(1);
    // Double coins: the bonus repeats the best qualifying discovery's coins (never below 75).
    const best = Math.max(75, ...Object.values(state.unlocked).map((u) => u.points));
    expect(daily[0].coins).toBeLessThanOrEqual(best);
    expect(daily[0].coins).toBeGreaterThanOrEqual(75);
    jest.useRealTimers();
  });
});
