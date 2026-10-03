import { fireEvent, render, screen } from '@testing-library/react-native';
import { DEMO_PLACES } from '@wandro/shared';
import { ProximityHud } from './ProximityHud';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
const pena = DEMO_PLACES.find((p) => p.id === 'demo-pena')!;

describe('ProximityHud', () => {
  it('shows distance, walking time and directions while approaching', async () => {
    await render(
      <ProximityHud
        target={pena}
        distanceM={420}
        startDistanceM={1000}
        trailActive={false}
        onDiscover={jest.fn()}
        onStop={jest.fn()}
      />,
    );
    expect(screen.getByTestId('hud-status')).toHaveTextContent(
      /Getting warmer · 420 m · ~4 min walk/,
    );
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ now: 63 });
    expect(screen.getByRole('link', { name: /Directions in Google Maps/ })).toBeOnTheScreen();
  });

  it('offers discovery once inside the geofence', async () => {
    const onDiscover = jest.fn();
    await render(
      <ProximityHud
        target={pena}
        distanceM={30}
        startDistanceM={1000}
        trailActive
        onDiscover={onDiscover}
        onStop={jest.fn()}
      />,
    );
    expect(screen.getByTestId('hud-status')).toHaveTextContent("You're here!");
    await fireEvent.press(screen.getByTestId('hud-discover'));
    expect(onDiscover).toHaveBeenCalled();
  });
});
