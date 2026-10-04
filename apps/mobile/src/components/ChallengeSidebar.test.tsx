import { fireEvent, render, screen } from '@testing-library/react-native';
import { DEMO_PLACES, haversineMeters, regionBySlug } from '@wandro/shared';
import { ChallengeSidebar } from './ChallengeSidebar';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a) } }));

const wrapper = queryWrapper();
const sintra = DEMO_PLACES.filter((p) => p.region === 'sintra' && !p.hidden);
const here = { lat: 38.7975, lng: -9.3905 };

function setup() {
  const props = {
    places: sintra,
    unlockedIds: new Set<string>(),
    position: here,
    region: regionBySlug('sintra')!,
    hidden: { count: 3, hint: 'very_close' as const },
    onSelect: jest.fn(),
    onShowChallenge: jest.fn(),
    onPickCity: jest.fn(),
    onClose: jest.fn(),
  };
  return props;
}

describe('ChallengeSidebar', () => {
  beforeEach(() => useSession.getState().reset());

  it('lists today, the hidden gem, friends and what is next', async () => {
    const props = setup();
    await render(<ChallengeSidebar {...props} />, { wrapper });
    expect(screen.getByText('Today’s challenge')).toBeOnTheScreen();
    expect(screen.getByTestId('gem-hint')).toHaveTextContent(
      '3 hidden gems nearby. One is very close, under 500 m. Look around!',
    );
    expect(screen.getByTestId('friend-challenge-demo-fc-1')).toBeOnTheScreen();
    expect(screen.getByText('Up next near you')).toBeOnTheScreen();
  });

  it('opens places, friend challenges and the city picker', async () => {
    const props = setup();
    await render(<ChallengeSidebar {...props} />, { wrapper });
    const nearest = [...sintra].sort(
      (a, b) => haversineMeters(here, a) - haversineMeters(here, b),
    )[0]!;
    await fireEvent.press(screen.getByRole('button', { name: new RegExp(`^${nearest.name}, `) }));
    expect(props.onSelect).toHaveBeenCalledWith(nearest);

    await fireEvent.press(screen.getByRole('button', { name: /mia\.maps challenged you/ }));
    expect(props.onShowChallenge).toHaveBeenCalledWith(
      expect.objectContaining({ place: expect.objectContaining({ id: 'demo-porto-dom-luis' }) }),
    );

    await fireEvent.press(screen.getByTestId('open-cities'));
    expect(props.onPickCity).toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('close-sidebar'));
    expect(props.onClose).toHaveBeenCalled();
  });

  it('nudges you to add friends when no one has challenged you', async () => {
    useSession.setState({ friendChallenges: [] });
    await render(<ChallengeSidebar {...setup()} />, { wrapper });
    await fireEvent.press(screen.getByRole('button', { name: /Add friends to swap challenges/ }));
    expect(mockPush).toHaveBeenCalledWith('/friends');
  });
});
