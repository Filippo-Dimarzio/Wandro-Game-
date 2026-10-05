import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import type { LatLng } from '@wandro/shared';
import { FlightOverlay } from './FlightOverlay';
import { useArrival } from '@/data/arrival';
import { useSession } from '@/state/session';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));

const sintra = { lat: 38.7975, lng: -9.3905 };
const lisbon = { lat: 38.7139, lng: -9.1394 };
const porto = { lat: 41.1496, lng: -8.611 };

beforeEach(() => useSession.getState().reset());

describe('useArrival (demo)', () => {
  it('remembers the first city without a trip, then travels on every change of city', async () => {
    const { rerender } = await renderHook(({ at }: { at: LatLng }) => useArrival(at, true), {
      initialProps: { at: sintra },
    });
    expect(useSession.getState().lastRegion).toBe('sintra');
    expect(useSession.getState().flight).toBeNull();

    await rerender({ at: lisbon });
    expect(useSession.getState().flight).toMatchObject({ from: 'sintra', to: 'lisbon' });

    await rerender({ at: porto });
    expect(useSession.getState().flight).toMatchObject({ from: 'lisbon', to: 'porto' });
    expect(useSession.getState().lastRegion).toBe('porto');
  });

  it('ignores positions that are not real', async () => {
    await renderHook(() => useArrival(porto, false));
    expect(useSession.getState().lastRegion).toBeNull();
  });
});

describe('FlightOverlay', () => {
  it('shows the route between airports and lands on tap', async () => {
    await act(() => useSession.getState().startFlight({ from: 'lisbon', to: 'porto', km: 275 }));
    await render(<FlightOverlay />);
    expect(screen.getByText('LIS')).toBeOnTheScreen();
    expect(screen.getByText('OPO')).toBeOnTheScreen();
    expect(screen.getByText('275 km travelled')).toBeOnTheScreen();
    expect(screen.getByTestId('trip-mode')).toHaveTextContent('By plane · 55 min');
    expect(screen.getByTestId('trip-vehicle-plane')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Flight from Lisbon (LIS) to Porto (OPO), 275 kilometres'),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('flight-done'));
    expect(useSession.getState().flight).toBeNull();
    expect(useSession.getState().landedAt).toBe(1);
    expect(screen.queryByTestId('flight-overlay')).toBeNull();
  });

  it('takes the train when the quicker way has no airport', async () => {
    await act(() => useSession.getState().startFlight({ from: 'sintra', to: 'lisbon', km: 25 }));
    await render(<FlightOverlay />);
    expect(screen.getByTestId('trip-mode')).toHaveTextContent('By train · 40 min');
    expect(screen.getByTestId('trip-vehicle-train')).toBeOnTheScreen();
    expect(screen.getByLabelText('Train from Sintra to Lisbon, 25 kilometres')).toBeOnTheScreen();
    expect(screen.queryByText('LIS')).toBeNull();
  });

  it('takes the green coach when that is quicker', async () => {
    await act(() => useSession.getState().startFlight({ from: 'evora', to: 'porto', km: 330 }));
    await render(<FlightOverlay />);
    expect(screen.getByTestId('trip-mode')).toHaveTextContent('By coach · 4 h 15 min');
    expect(screen.getByTestId('trip-vehicle-bus')).toBeOnTheScreen();
  });
});
