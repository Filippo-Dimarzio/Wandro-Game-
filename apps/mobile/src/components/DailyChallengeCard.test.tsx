import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { DEMO_PLACES } from '@wandro/shared';
import { useSession } from '@/state/session';
import { DailyChallengeCard } from './DailyChallengeCard';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('DailyChallengeCard (demo mode)', () => {
  beforeEach(() => useSession.getState().reset());

  it('stays locked until a matching place is discovered, then a hold claims the bonus once', async () => {
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
        useSession.getState().unlock(p.id, 10);
      }
    });
    expect(screen.getByRole('button', { name: /confirm the daily challenge/i })).toBeEnabled();

    await fireEvent(
      screen.getByRole('button', { name: /confirm the daily challenge/i }),
      'pressIn',
    );
    await act(async () => void jest.advanceTimersByTime(1000));

    expect(screen.getByText(/Completed/)).toBeOnTheScreen();
    expect(useSession.getState().bonusPoints).toBe(75);
    jest.useRealTimers();
  });
});
