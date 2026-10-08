import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { DEMO_PLACES } from '@wandro/shared';
import { ChallengeIntro, introText } from '@/components/ChallengeIntro';
import { useChallengeIntro } from '@/state/challengeIntro';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const pena = DEMO_PLACES.find((p) => p.id === 'demo-pena')!;

describe('ChallengeIntro', () => {
  // The first render compiles the stamp and map helpers; slow on a cold CI cache.
  jest.setTimeout(20_000);

  beforeEach(() => {
    useSession.getState().reset();
    useChallengeIntro.getState().hide();
    jest.mocked(router.push).mockClear();
  });

  it('shows the place as a clean stamp, a teaser and what it pays, before you set off', async () => {
    await render(<ChallengeIntro />, { wrapper: queryWrapper() });
    expect(screen.queryByTestId('challenge-intro')).toBeNull();
    await act(async () => useChallengeIntro.getState().show(pena));
    expect(screen.getByTestId('challenge-intro')).toBeOnTheScreen();
    expect(screen.getByLabelText('Stamp of Pena Palace, not collected yet')).toBeOnTheScreen();
    expect(screen.getByTestId('intro-teaser')).toHaveTextContent(introText(pena));
    expect(screen.getByText('+50 XP', { exact: false })).toBeOnTheScreen();
  });

  it('"Let’s go!" guides you there on the map; "Read more" opens the place sheet', async () => {
    await render(<ChallengeIntro />, { wrapper: queryWrapper() });
    await act(async () => useChallengeIntro.getState().show(pena));
    await fireEvent.press(screen.getByTestId('intro-go'));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: '/(tabs)/explore',
      params: expect.objectContaining({ place: pena.id, guide: '1' }),
    });
    expect(screen.queryByTestId('challenge-intro')).toBeNull();

    await act(async () => useChallengeIntro.getState().show(pena));
    await fireEvent.press(screen.getByTestId('intro-more'));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: '/(tabs)/explore',
      params: expect.objectContaining({ place: pena.id, open: 'sheet' }),
    });
  });

  it('a collected place shows its stamp postmarked', async () => {
    useSession.getState().recordVisit(pena, DEMO_PLACES);
    await render(<ChallengeIntro />, { wrapper: queryWrapper() });
    await act(async () => useChallengeIntro.getState().show(pena));
    expect(screen.getByLabelText('Stamp of Pena Palace, collected')).toBeOnTheScreen();
    expect(screen.getByText('See it on the map')).toBeOnTheScreen();
  });

  it('keeps the teaser short when a place has only a long description', () => {
    const long = { ...pena, details: undefined, description: 'word '.repeat(80) };
    expect(introText(long).length).toBeLessThanOrEqual(181);
    expect(introText(long).endsWith('…')).toBe(true);
  });
});
