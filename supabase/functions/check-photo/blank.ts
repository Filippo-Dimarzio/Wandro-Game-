/**
 * Copy of packages/shared/src/photo.ts for the Edge Function (which can only import its own
 * folder). Keep the thresholds identical: packages/shared/src/photo.test.ts checks them.
 */
export const BLANK_MAX_STDDEV = 8;
export const DARK_MAX_MEAN = 18;
export const DARK_MAX_STDDEV = 14;

export function photoStats(rgba: Uint8Array): { mean: number; stddev: number } {
  const n = Math.floor(rgba.length / 4);
  if (n === 0) return { mean: 0, stddev: 0 };
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < n; i++) {
    const y = 0.299 * rgba[i * 4]! + 0.587 * rgba[i * 4 + 1]! + 0.114 * rgba[i * 4 + 2]!;
    sum += y;
    sumSq += y * y;
  }
  const mean = sum / n;
  return { mean, stddev: Math.sqrt(Math.max(0, sumSq / n - mean * mean)) };
}

export function photoLooksBlank(rgba: Uint8Array): boolean {
  const { mean, stddev } = photoStats(rgba);
  return stddev < BLANK_MAX_STDDEV || (mean < DARK_MAX_MEAN && stddev < DARK_MAX_STDDEV);
}
