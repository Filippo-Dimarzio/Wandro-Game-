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
const paris = { lat: 48.8566, lng: 2.3522 };

beforeEach(() => useSession.getState().reset());

describe('useArrival (demo)', () => {
  it('remembers the first city without a flight, then flies to a far city', async () => {
    const { rerender } = await renderHook(({ at }: { at: LatLng }) => useArrival(at, true), {
      initialProps: { at: sintra },
    });
    expect(useSession.getState().lastRegion).toBe('sintra');
    expect(useSession.getState().flight).toBeNull();

    await rerender({ at: lisbon });
    expect(useSession.getState().flight).toBeNull();

    await rerender({ at: paris });
    expect(useSession.getState().flight).toMatchObject({ from: 'lisbon', to: 'paris' });
    expect(useSession.getState().lastRegion).toBe('paris');
  });

  it('ignores positions that are not real', async () => {
    await renderHook(() => useArrival(paris, false));
    expect(useSession.getState().lastRegion).toBeNull();
  });
});

describe('FlightOverlay', () => {
  it('shows the route between airports and lands on tap', async () => {
    await act(() => useSession.getState().startFlight({ from: 'lisbon', to: 'paris', km: 1452 }));
    await render(<FlightOverlay />);
    expect(screen.getByText('LIS')).toBeOnTheScreen();
    expect(screen.getByText('CDG')).toBeOnTheScreen();
    expect(screen.getByText('1,452 km travelled')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Flight from Lisbon (LIS) to Paris (CDG), 1452 kilometres'),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('flight-done'));
    expect(useSession.getState().flight).toBeNull();
    expect(useSession.getState().landedAt).toBe(1);
    expect(screen.queryByTestId('flight-overlay')).toBeNull();
  });
});
