import { fireEvent, render, screen } from '@testing-library/react-native';
import { MapAmbience } from './MapAmbience';
import { useSession } from '@/state/session';

const hidden = { includeHiddenElements: true };
const layout = { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 700 } } };

describe('MapAmbience', () => {
  beforeEach(() => useSession.getState().reset());

  it('never blocks taps on the map and is hidden from screen readers', async () => {
    await render(<MapAmbience />);
    const layer = screen.getByTestId('map-ambience', hidden);
    expect(layer.props.pointerEvents).toBe('none');
    expect(layer.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('drifts leaves by day and shows fireflies at night', async () => {
    await render(<MapAmbience />);
    await fireEvent(screen.getByTestId('map-ambience', hidden), 'layout', layout);
    expect(screen.getAllByTestId('leaf', hidden)).toHaveLength(9);
    expect(screen.queryAllByTestId('firefly', hidden)).toHaveLength(0);
    useSession.getState().setTheme('dark');
    await render(<MapAmbience />);
    await fireEvent(screen.getByTestId('map-ambience', hidden), 'layout', layout);
    expect(screen.getAllByTestId('firefly', hidden)).toHaveLength(9);
  });
});
