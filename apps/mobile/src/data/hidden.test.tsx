import { act, renderHook } from '@testing-library/react-native';
import { useHiddenGems } from './hidden';
import { usePlaces } from './places';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

const wrapper = queryWrapper();
const sintra = { lat: 38.7975, lng: -9.3905 };
// ~100 m from the Moorish Fountain gem.
const nearFountain = { lat: 38.7983, lng: -9.387 };

beforeEach(() => useSession.getState().reset());

describe('useHiddenGems (demo)', () => {
  it('hints at nearby gems without revealing them', async () => {
    const { result } = await renderHook(() => useHiddenGems(sintra, true), { wrapper });
    expect(result.current).toEqual({ count: 3, hint: 'very_close' });
    expect(useSession.getState().revealed).toEqual({});
  });

  it('reveals a gem within 200 m and adds it to the map', async () => {
    const { result, rerender } = await renderHook(
      ({ at }: { at: { lat: number; lng: number } }) => ({
        hint: useHiddenGems(at, true),
        places: usePlaces(at).data ?? [],
      }),
      { wrapper, initialProps: { at: sintra } },
    );
    await act(async () => {});
    expect(result.current.places.some((p) => p.id === 'demo-sintra-fonte-mourisca')).toBe(false);

    await rerender({ at: nearFountain });
    await act(async () => {});
    expect(Object.keys(useSession.getState().revealed)).toEqual(['demo-sintra-fonte-mourisca']);
    expect(useSession.getState().justRevealed).toBe('demo-sintra-fonte-mourisca');
    expect(result.current.places.some((p) => p.id === 'demo-sintra-fonte-mourisca')).toBe(true);
    expect(result.current.hint.count).toBe(2);
  });

  it('does not reveal from a position that is not real', async () => {
    await renderHook(() => useHiddenGems(nearFountain, false), { wrapper });
    expect(useSession.getState().revealed).toEqual({});
  });
});
