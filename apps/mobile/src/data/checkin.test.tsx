import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { DEMO_PLACES, pointsForVisit } from '@wandro/shared';
import type { UserLocation } from '@/lib/useLocation';
import { useSession } from '@/state/session';
import { useCheckin } from './checkin';

const adraga = DEMO_PLACES.find((p) => p.id === 'demo-adraga')!;
const at = (lat: number, lng: number): UserLocation => ({
  position: { lat, lng },
  accuracy: 5,
  isReal: false,
  isMocked: false,
  permission: 'granted',
  request: async () => undefined,
});
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('useCheckin (demo mode)', () => {
  beforeEach(() => {
    useSession.getState().reset();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  it('verifies after the dwell time and awards coins', async () => {
    const { result } = await renderHook(() => useCheckin(at(adraga.lat, adraga.lng), DEMO_PLACES), {
      wrapper,
    });
    await act(async () => result.current.start(adraga));
    expect(result.current.phase.kind).toBe('dwelling');
    await act(async () => void jest.advanceTimersByTime(9000));
    expect(result.current.phase).toMatchObject({
      kind: 'done',
      outcome: { status: 'verified', coins: pointsForVisit('nature', adraga.uniqueVisitors).total },
    });
    expect(useSession.getState().unlocked[adraga.id]).toBeDefined();
  });

  it('rejects when the explorer walks away during the dwell', async () => {
    let loc = at(adraga.lat, adraga.lng);
    const { result, rerender } = await renderHook(() => useCheckin(loc, DEMO_PLACES), { wrapper });
    await act(async () => result.current.start(adraga));
    await act(async () => void jest.advanceTimersByTime(2000));
    loc = at(adraga.lat + 0.01, adraga.lng);
    await rerender({});
    await act(async () => void jest.advanceTimersByTime(8000));
    expect(result.current.phase).toMatchObject({
      kind: 'done',
      outcome: { status: 'rejected', reason: 'left_geofence' },
    });
    expect(useSession.getState().unlocked[adraga.id]).toBeUndefined();
  });
});
