import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { DEMO_PLACES } from '@wandro/shared';
import { RewardCard } from '@/components/RewardCard';
import { StreakFlame } from '@/components/Streak';
import { lisbonDate } from '@/demo/engine';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const pena = DEMO_PLACES.find((p) => p.id === 'demo-pena')!;
const yesterday = () => lisbonDate(new Date(Date.now() - 86_400_000));

describe('Daily streak', () => {
  beforeEach(() => useSession.getState().reset());

  it('starts at 0 and lights up once you complete a challenge today', async () => {
    await render(<StreakFlame />, { wrapper: queryWrapper() });
    expect(screen.getByTestId('streak-flame')).toHaveTextContent('🔥0');
    await act(async () => void useSession.getState().recordVisit(pena, DEMO_PLACES));
    expect(screen.getByTestId('streak-flame')).toHaveTextContent('🔥1');
    await fireEvent.press(screen.getByTestId('streak-flame'));
    expect(screen.getByTestId('streak-sheet')).toBeOnTheScreen();
    expect(screen.getAllByTestId('streak-day-lit')).toHaveLength(1);
    expect(screen.getByTestId('streak-message')).toHaveTextContent(/safe for today/);
  });

  it('warns that a streak from yesterday is at risk until you play today', async () => {
    useSession.setState({ streak: 4, lastActiveDate: yesterday() });
    await render(<StreakFlame />, { wrapper: queryWrapper() });
    await fireEvent.press(screen.getByTestId('streak-flame'));
    expect(screen.getByTestId('streak-message')).toHaveTextContent(
      'Complete a challenge today to keep your 4-day streak!',
    );
  });

  it('drops to 0 after a missed day', async () => {
    useSession.setState({ streak: 9, lastActiveDate: '2020-01-01' });
    await render(<StreakFlame />, { wrapper: queryWrapper() });
    expect(screen.getByTestId('streak-flame')).toHaveTextContent('🔥0');
  });

  it('celebrates the first challenge of the day on the reward card, once', async () => {
    useSession.setState({ streak: 2, lastActiveDate: yesterday() });
    const r = useSession.getState().recordVisit(pena, DEMO_PLACES)!;
    const outcome = { status: 'verified' as const, ...r };
    const first = await render(
      <RewardCard placeName="Pena Palace" outcome={outcome} onDone={() => undefined} />,
      { wrapper: queryWrapper() },
    );
    expect(screen.getByTestId('reward-streak')).toHaveTextContent(/3-day streak!/);
    first.unmount();
    await render(
      <RewardCard placeName="Pena Palace" outcome={outcome} onDone={() => undefined} />,
      {
        wrapper: queryWrapper(),
      },
    );
    expect(screen.queryByTestId('reward-streak')).toBeNull();
  });
});
