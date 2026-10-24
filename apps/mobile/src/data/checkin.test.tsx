import { act, renderHook } from '@testing-library/react-native';
import { ACTIVITY_COIN_CAP, DEMO_PLACES } from '@wandro/shared';
import type { UserLocation } from '@/lib/useLocation';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';
import { useCheckin } from './checkin';

const adraga = DEMO_PLACES.find((p) => p.id === 'demo-adraga')!;
const at = (lat: number, lng: number): UserLocation => ({
  position: { lat, lng },
  accuracy: 5,
  isReal: false,
  isMocked: false,
  permission: 'granted',
  request: async () => 'granted' as const,
});
const wrapper = queryWrapper();

describe('useCheckin (demo mode)', () => {
  beforeEach(() => useSession.getState().reset());

  it('verifies straight away, with no waiting, and awards coins', async () => {
    const { result } = await renderHook(() => useCheckin(at(adraga.lat, adraga.lng), DEMO_PLACES), {
      wrapper,
    });
    await act(async () => result.current.start(adraga));
    expect(result.current.phase).toMatchObject({
      kind: 'done',
      // Adraga is in "The wild coast" set, but the visit already pays the 50-coin cap.
      outcome: {
        status: 'verified',
        coins: ACTIVITY_COIN_CAP,
        setCoins: 0,
      },
    });
    expect(useSession.getState().unlocked[adraga.id]).toBeDefined();
  });

  it('rejects a check-in from outside the place', async () => {
    const { result } = await renderHook(
      () => useCheckin(at(adraga.lat + 0.01, adraga.lng), DEMO_PLACES),
      { wrapper },
    );
    await act(async () => result.current.start(adraga));
    expect(result.current.phase).toMatchObject({
      kind: 'done',
      outcome: { status: 'rejected', reason: 'left_geofence' },
    });
    expect(useSession.getState().unlocked[adraga.id]).toBeUndefined();
  });
});
