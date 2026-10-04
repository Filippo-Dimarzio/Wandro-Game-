import { act, render, screen } from '@testing-library/react-native';
import { DEMO_PLACES } from '@wandro/shared';
import Passport from '../../app/passport';
import { perforations } from '@/components/PostageStamp';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

describe('perforations', () => {
  it('spaces the teeth evenly along an edge, never touching the corners', () => {
    const teeth = perforations(100, 4);
    expect(teeth.length).toBe(9);
    expect(teeth[0]).toBeGreaterThan(0);
    expect(teeth[teeth.length - 1]).toBeLessThan(100);
    const gaps = teeth.slice(1).map((x, i) => x - teeth[i]);
    for (const g of gaps) expect(g).toBeCloseTo(gaps[0]);
  });

  it('keeps at least three teeth on a tiny stamp', () => {
    expect(perforations(10, 4)).toHaveLength(3);
  });
});

describe('Passport city stamps', () => {
  beforeEach(() => useSession.getState().reset());

  it('shows an empty slot per city until you collect its stamp', async () => {
    await render(<Passport />, { wrapper: queryWrapper() });
    for (const slug of ['sintra', 'lisbon', 'porto', 'evora', 'aveiro'])
      expect(screen.getByTestId(`passport-slot-${slug}`)).toBeOnTheScreen();
    expect(screen.getByText('0 of 5 cities collected')).toBeOnTheScreen();

    const temple = DEMO_PLACES.find((p) => p.id === 'demo-evora-roman-temple')!;
    await act(async () => void useSession.getState().recordVisit(temple, DEMO_PLACES));
    expect(screen.getByTestId('passport-city-evora')).toBeOnTheScreen();
    expect(screen.getByLabelText('Évora stamp')).toBeOnTheScreen();
    expect(screen.queryByTestId('passport-slot-evora')).toBeNull();
    expect(screen.getByText('1 of 5 cities collected')).toBeOnTheScreen();
  });
});
