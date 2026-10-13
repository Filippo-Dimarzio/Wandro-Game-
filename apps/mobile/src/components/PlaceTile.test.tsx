import { fireEvent, render, screen } from '@testing-library/react-native';
import { DEMO_PLACES } from '@wandro/shared';
import { queryWrapper } from '@/test/queryWrapper';
import { PlaceGrid, PlaceTile } from './PlaceBits';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const [pena, mouros] = ['demo-pena', 'demo-mouros'].map(
  (id) => DEMO_PLACES.find((p) => p.id === id)!,
);

describe('PlaceTile', () => {
  it('shows each place as a card in a grid, with its name, distance and points', async () => {
    const onPress = jest.fn();
    await render(
      <PlaceGrid>
        <PlaceTile place={pena} distanceM={160} unlocked={false} onPress={onPress} />
        <PlaceTile place={mouros} distanceM={1200} unlocked onPress={() => {}} />
      </PlaceGrid>,
      { wrapper: queryWrapper() },
    );
    expect(screen.getByText('Pena Palace')).toBeOnTheScreen();
    expect(screen.getByText(/^160 m · \d+ pts$/)).toBeOnTheScreen();
    expect(screen.getByText('1.2 km · Discovered')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('place-tile-demo-pena'));
    expect(onPress).toHaveBeenCalled();
  });
});
