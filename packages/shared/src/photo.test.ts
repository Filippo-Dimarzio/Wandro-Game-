import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BLANK_MAX_STDDEV, DARK_MAX_MEAN, DARK_MAX_STDDEV, photoLooksBlank } from './photo';

const fill = (n: number, px: (i: number) => [number, number, number]) => {
  const a = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) a.set([...px(i), 255], i * 4);
  return a;
};
// Deterministic "noise" so tests don't depend on Math.random.
const noise = (i: number, spread: number) => (((i * 9301 + 49297) % 233280) / 233280) * spread;

describe('photoLooksBlank', () => {
  it('rejects black, white and flat-colour frames', () => {
    expect(photoLooksBlank(fill(1024, () => [0, 0, 0]))).toBe(true);
    expect(photoLooksBlank(fill(1024, () => [255, 255, 255]))).toBe(true);
    expect(photoLooksBlank(fill(1024, () => [30, 120, 200]))).toBe(true);
  });

  it('rejects a covered lens: very dark with a little sensor noise', () => {
    expect(
      photoLooksBlank(
        fill(1024, (i) => {
          const v = 4 + noise(i, 12);
          return [v, v, v];
        }),
      ),
    ).toBe(true);
  });

  it('accepts real photos, including dark ones with detail', () => {
    const scene = fill(1024, (i) => {
      const v = (i % 32) * 7 + noise(i, 30);
      return [v, v * 0.9, v * 0.8];
    });
    expect(photoLooksBlank(scene)).toBe(false);
    const night = fill(1024, (i) => (i % 97 < 10 ? [230, 200, 120] : [8, 10, 20]));
    expect(photoLooksBlank(night)).toBe(false);
  });

  it('the check-photo Edge Function uses the same thresholds', () => {
    const fn = readFileSync(
      join(__dirname, '..', '..', '..', 'supabase', 'functions', 'check-photo', 'blank.ts'),
      'utf8',
    );
    expect(fn).toContain(`BLANK_MAX_STDDEV = ${BLANK_MAX_STDDEV};`);
    expect(fn).toContain(`DARK_MAX_MEAN = ${DARK_MAX_MEAN};`);
    expect(fn).toContain(`DARK_MAX_STDDEV = ${DARK_MAX_STDDEV};`);
  });
});
