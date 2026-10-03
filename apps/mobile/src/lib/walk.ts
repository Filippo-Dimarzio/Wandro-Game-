import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { moveBy, type LatLng } from '@wandro/shared';
import { useSession } from '@/state/session';

/** Game-speed walking (m/s) so places a few km apart are reachable; Shift walks slowly. */
export const WALK_SPEED_MPS = 20;
export const SLOW_WALK_SPEED_MPS = 4;
const TICK_MS = 80;

export type Direction = 'up' | 'down' | 'left' | 'right';
const VECTORS: Record<Direction, [number, number]> = {
  up: [0, 1],
  down: [0, -1],
  left: [-1, 0],
  right: [1, 0],
};
const KEYS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};

/** One movement step for the held directions (diagonals normalised). */
export function stepPosition(from: LatLng, held: Set<Direction>, metres: number): LatLng {
  let dx = 0;
  let dy = 0;
  for (const d of held) {
    dx += VECTORS[d][0];
    dy += VECTORS[d][1];
  }
  const len = Math.hypot(dx, dy);
  if (!len) return from;
  return moveBy(from, (dx / len) * metres, (dy / len) * metres);
}

/**
 * Walk the octopus in demo mode: WASD / arrow keys on web and desktop, or the on-screen pad.
 * Moves the demo position, which the map, check-ins and proximity all read.
 */
export function useWalkControls(enabled: boolean, start: LatLng) {
  const setTeleport = useSession((s) => s.setTeleport);
  const held = useRef(new Set<Direction>());
  const slow = useRef(false);
  const startRef = useRef(start);
  startRef.current = start;

  useEffect(() => {
    if (!enabled) return;
    const keys = held.current;
    const timer = setInterval(() => {
      if (!keys.size) return;
      const from = useSession.getState().teleport ?? startRef.current;
      const metres = ((slow.current ? SLOW_WALK_SPEED_MPS : WALK_SPEED_MPS) * TICK_MS) / 1000;
      setTeleport(stepPosition(from, keys, metres));
    }, TICK_MS);

    if (Platform.OS !== 'web') return () => clearInterval(timer);
    const isTyping = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    };
    const down = (e: KeyboardEvent) => {
      const dir = KEYS[e.key] ?? KEYS[e.key.toLowerCase()];
      slow.current = e.shiftKey;
      if (!dir || isTyping(e)) return;
      e.preventDefault();
      keys.add(dir);
    };
    const up = (e: KeyboardEvent) => {
      const dir = KEYS[e.key] ?? KEYS[e.key.toLowerCase()];
      slow.current = e.shiftKey;
      if (dir) keys.delete(dir);
    };
    const blur = () => keys.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      keys.clear();
    };
  }, [enabled, setTeleport]);

  return {
    press: (d: Direction) => held.current.add(d),
    release: (d: Direction) => held.current.delete(d),
  };
}
