import { act, renderHook } from '@testing-library/react-native';
import { haversineMeters } from '@wandro/shared';
import { useSession } from '@/state/session';
import { stepPosition, useWalkControls, WALK_SPEED_MPS } from './walk';

const start = { lat: 38.7975, lng: -9.3905 };

describe('walking', () => {
  it('steps in the held direction and normalises diagonals', () => {
    const north = stepPosition(start, new Set(['up']), 10);
    expect(north.lat).toBeGreaterThan(start.lat);
    expect(haversineMeters(start, north)).toBeCloseTo(10, 0);
    const diag = stepPosition(start, new Set(['up', 'right']), 10);
    expect(haversineMeters(start, diag)).toBeCloseTo(10, 0);
    expect(stepPosition(start, new Set(['up', 'down']), 10)).toEqual(start);
  });

  it('walks the demo octopus while a direction is held', async () => {
    jest.useFakeTimers();
    useSession.getState().reset();
    const { result } = await renderHook(() => useWalkControls(true, start));
    await act(async () => result.current.press('right'));
    await act(async () => void jest.advanceTimersByTime(1000));
    await act(async () => result.current.release('right'));
    const pos = useSession.getState().teleport!;
    expect(pos.lng).toBeGreaterThan(start.lng);
    expect(haversineMeters(start, pos)).toBeCloseTo(WALK_SPEED_MPS, -1);
    await act(async () => void jest.advanceTimersByTime(1000));
    expect(useSession.getState().teleport).toEqual(pos);
    jest.useRealTimers();
  });
});
