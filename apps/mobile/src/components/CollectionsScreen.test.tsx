import { fireEvent, render, screen } from '@testing-library/react-native';
import Collections from '../../app/(tabs)/collections';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const wrapper = queryWrapper();

describe('Collections', () => {
  beforeEach(() => useSession.getState().reset());

  it('shows one card per city with its sets, and opens a city', async () => {
    await render(<Collections />, { wrapper });
    expect(screen.getByTestId('city-card-sintra')).toBeOnTheScreen();
    expect(screen.getByTestId('city-card-paris')).toBeOnTheScreen();
    expect(
      screen.getByText('Each place in a set pays +20 coins; finish the set for +50.'),
    ).toBeOnTheScreen();
    // Sintra (where the demo starts) is open; Paris is closed.
    expect(screen.getByTestId('set-demo-col-palaces')).toBeOnTheScreen();
    expect(screen.queryByTestId('set-demo-col-paris-icons')).toBeNull();

    fireEvent.press(screen.getByLabelText(/^Paris, 0\/10 places/));
    expect(await screen.findByTestId('set-demo-col-paris-icons')).toBeOnTheScreen();
    expect(screen.getByTestId('set-demo-col-paris-art-rails')).toBeOnTheScreen();
    expect(screen.getAllByText('+20 each · +50 for the set').length).toBeGreaterThan(0);
  });
});
