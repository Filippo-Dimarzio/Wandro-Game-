import { CATEGORIES } from '@wandro/shared';
import { darkColors, lightColors } from './theme';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA = 4.5;

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
])('%s theme contrast (WCAG AA)', (_, c) => {
  it.each(CATEGORIES)('%s ink is readable on cards, the background and its own tint', (cat) => {
    expect(contrast(c.category[cat], c.card)).toBeGreaterThanOrEqual(AA);
    expect(contrast(c.category[cat], c.bg)).toBeGreaterThanOrEqual(AA);
    expect(contrast(c.category[cat], c.categoryTint[cat])).toBeGreaterThanOrEqual(AA);
  });

  it.each(CATEGORIES)('%s chips keep their label readable when selected', (cat) => {
    expect(contrast(c.onCategory, c.category[cat])).toBeGreaterThanOrEqual(AA);
  });

  it('keeps body text, muted text, accent and gold readable', () => {
    for (const bg of [c.bg, c.card, c.surface]) {
      expect(contrast(c.text, bg)).toBeGreaterThanOrEqual(AA);
      expect(contrast(c.textMuted, bg)).toBeGreaterThanOrEqual(AA);
      expect(contrast(c.accent, bg)).toBeGreaterThanOrEqual(AA);
    }
    expect(contrast(c.accentOn, c.accent)).toBeGreaterThanOrEqual(AA);
    expect(contrast(c.gold, c.goldSoft)).toBeGreaterThanOrEqual(AA);
    expect(contrast(c.gold, c.card)).toBeGreaterThanOrEqual(AA);
  });
});
