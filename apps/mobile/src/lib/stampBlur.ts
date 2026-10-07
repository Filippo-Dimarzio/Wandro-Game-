/** How blurred a city's stamp is before you've completed anything there (pixels). */
export const STAMP_MAX_BLUR = 16;

/**
 * The Collections card shows each city's vintage stamp, blurred until you play there: every
 * completed challenge in the city clears it a little, and finishing the city shows it sharp.
 */
export function stampBlur(done: number, total: number): number {
  if (total <= 0) return STAMP_MAX_BLUR;
  const left = 1 - Math.min(1, Math.max(0, done) / total);
  return Math.round(STAMP_MAX_BLUR * left * 10) / 10;
}
