import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { LocationPrompt } from '@/components/LocationPrompt';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

describe('LocationPrompt', () => {
  it('explains why before asking, then shows the system prompt', async () => {
    const onRequest = jest.fn(async () => 'granted' as const);
    await render(<LocationPrompt permission="undetermined" onRequest={onRequest} />);
    expect(screen.getByText('Allow Wandro to use your location?')).toBeOnTheScreen();
    expect(screen.getByText(/never in the background/)).toBeOnTheScreen();
    await act(async () => void fireEvent.press(screen.getByTestId('location-allow')));
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it('"Not now" shrinks it to a small chip that can still turn location on', async () => {
    const onRequest = jest.fn(async () => 'granted' as const);
    await render(<LocationPrompt permission="undetermined" onRequest={onRequest} />);
    await fireEvent.press(screen.getByTestId('location-later'));
    expect(screen.queryByTestId('location-prompt')).toBeNull();
    await act(async () => void fireEvent.press(screen.getByTestId('location-chip')));
    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it('when location was refused, says how to turn it back on', async () => {
    await render(<LocationPrompt permission="denied" onRequest={jest.fn()} />);
    expect(screen.getByText('Location is off')).toBeOnTheScreen();
    expect(screen.getByText(/Settings|browser/)).toBeOnTheScreen();
  });

  it('shows nothing once location is allowed', async () => {
    await render(<LocationPrompt permission="granted" onRequest={jest.fn()} />);
    expect(screen.queryByTestId('location-prompt')).toBeNull();
    expect(screen.queryByTestId('location-chip')).toBeNull();
  });
});
