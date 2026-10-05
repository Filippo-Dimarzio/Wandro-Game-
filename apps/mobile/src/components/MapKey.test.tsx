import { fireEvent, render, screen } from '@testing-library/react-native';
import { MapKey } from './MapKey';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

describe('MapKey', () => {
  it('counts places to explore and discovered, and explains them on tap', async () => {
    await render(<MapKey toExplore={12} discovered={3} />);
    expect(screen.getByText('To explore 12')).toBeOnTheScreen();
    expect(screen.getByText('Discovered 3')).toBeOnTheScreen();
    expect(screen.queryByTestId('map-key-help')).toBeNull();
    await fireEvent.press(screen.getByTestId('map-key'));
    expect(screen.getByTestId('map-key-help')).toHaveTextContent(/Go there and check in/);
  });
});
