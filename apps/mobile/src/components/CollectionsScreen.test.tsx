import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { DEMO_PLACES } from '@wandro/shared';
import Collections from '../../app/(tabs)/collections';
import { STAMP_MAX_BLUR } from '@/lib/stampBlur';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const wrapper = queryWrapper();

describe('Collections', () => {
  beforeEach(() => useSession.getState().reset());

  it('shows a box per Portuguese city, greyed out until you discover a place there', async () => {
    await render(<Collections />, { wrapper });
    for (const slug of ['sintra', 'lisbon', 'porto', 'evora', 'aveiro'])
      expect(screen.getByTestId(`city-card-${slug}`)).toBeOnTheScreen();
    expect(screen.queryByTestId('city-card-paris')).toBeNull();
    expect(screen.getByTestId('city-locked-evora')).toBeOnTheScreen();

    const temple = DEMO_PLACES.find((p) => p.id === 'demo-evora-roman-temple')!;
    await act(async () => void useSession.getState().recordVisit(temple, DEMO_PLACES));
    expect(screen.queryByTestId('city-locked-evora')).toBeNull();
    expect(screen.getByTestId('city-stamp-evora')).toBeOnTheScreen();
    expect(screen.queryByTestId('city-stamp-aveiro')).toBeNull();
    expect(screen.getByTestId('city-locked-aveiro')).toBeOnTheScreen();
  });

  it('shows each city as its vintage stamp, blurred until you complete challenges there', async () => {
    await render(<Collections />, { wrapper });
    const blurOf = () => screen.getByTestId('city-art-evora').props.blurRadius as number;
    const before = blurOf();
    expect(before).toBe(STAMP_MAX_BLUR);
    const temple = DEMO_PLACES.find((p) => p.id === 'demo-evora-roman-temple')!;
    await act(async () => void useSession.getState().recordVisit(temple, DEMO_PLACES));
    expect(blurOf()).toBeLessThan(before);
    expect(blurOf()).toBeGreaterThan(0);
  });

  it('has no trophy button: the leaderboard lives on Profile', async () => {
    await render(<Collections />, { wrapper });
    expect(screen.queryByLabelText('Leaderboard')).toBeNull();
  });

  it('opens a city with its sets and how far you are from its hidden gems', async () => {
    await render(<Collections />, { wrapper });
    fireEvent.press(screen.getByLabelText(/^Évora, /));
    expect(await screen.findByTestId('city-sheet')).toBeOnTheScreen();
    expect(screen.getByTestId('set-demo-col-evora-icons')).toBeOnTheScreen();
    expect(screen.getByTestId('set-demo-col-evora-art')).toBeOnTheScreen();
    expect(
      screen.getByText('Discover 5 more places here to reveal its hidden gems.'),
    ).toBeOnTheScreen();
    expect(screen.getAllByText('+20 each · +50 for the set').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('city-sheet-stamp')).toBeNull();
  });

  it('stamps a city you have collected when you open it', async () => {
    const temple = DEMO_PLACES.find((p) => p.id === 'demo-evora-roman-temple')!;
    useSession.getState().recordVisit(temple, DEMO_PLACES);
    await render(<Collections />, { wrapper });
    fireEvent.press(screen.getByLabelText(/^Évora, /));
    expect(await screen.findByTestId('city-sheet-stamp')).toBeOnTheScreen();
    expect(screen.getByText('Stamp collected')).toBeOnTheScreen();
  });
});
