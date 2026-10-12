import { act, renderHook } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { useSession } from '@/state/session';
import { useLocation } from './useLocation';

type Callback = (l: { coords: { latitude: number; longitude: number; accuracy: number } }) => void;
let push: Callback = () => undefined;

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: 'undetermined' })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  watchPositionAsync: jest.fn(async (_opts: unknown, cb: Callback) => {
    push = cb;
    return { remove: jest.fn() };
  }),
  Accuracy: { High: 4 },
}));

describe('useLocation', () => {
  beforeEach(() => useSession.getState().reset());

  it('asks once, shares the answer with every screen and follows you in real time', async () => {
    useSession.getState().setTeleport({ lat: 38.79, lng: -9.39 });
    const a = await renderHook(() => useLocation());
    const b = await renderHook(() => useLocation());
    expect(a.result.current.permission).toBe('undetermined');
    expect(a.result.current.isReal).toBe(false);

    await act(async () => void (await a.result.current.request()));
    expect(b.result.current.permission).toBe('granted');
    // Allowing location replaces the demo's teleport with your real position.
    expect(useSession.getState().teleport).toBeNull();
    expect(Location.watchPositionAsync).toHaveBeenCalledTimes(1);

    await act(async () => push({ coords: { latitude: 37.1, longitude: -8.6, accuracy: 6 } }));
    expect(b.result.current).toMatchObject({ isReal: true, position: { lat: 37.1, lng: -8.6 } });
    await act(async () => push({ coords: { latitude: 37.1002, longitude: -8.6, accuracy: 6 } }));
    expect(a.result.current.position.lat).toBe(37.1002);
  });
});
