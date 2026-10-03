import { dayRanges, openStatus, type OpeningSlot, type Place } from '@wandro/shared';
import { t, type TranslationKey } from '@/i18n';

const day = (d: number) => t(`day.${d}` as TranslationKey);

/** "Open now · until 00:30" / "Opens Thu at 21:30". Null for places without set times. */
export function hoursStatus(
  place: Place,
  now = new Date(),
): { open: boolean; label: string } | null {
  const s = openStatus(place.hours, now);
  if (!s) return null;
  if (s.open) return { open: true, label: t('hours.openUntil', { time: s.closes }) };
  if (s.inDays === 0) return { open: false, label: t('hours.opensToday', { time: s.opensAt }) };
  if (s.inDays === 1) return { open: false, label: t('hours.opensTomorrow', { time: s.opensAt }) };
  return { open: false, label: t('hours.opensOn', { day: day(s.opensDay), time: s.opensAt }) };
}

/** One line per slot, e.g. "Thu–Sat · 21:30–00:30". */
export function scheduleLines(hours: OpeningSlot[] | undefined): string[] {
  return (hours ?? []).map((slot) =>
    t('hours.schedule', {
      days: dayRanges(slot.days)
        .map(([a, b]) => (a === b ? day(a) : `${day(a)}–${day(b)}`))
        .join(', '),
      open: slot.open,
      close: slot.close,
    }),
  );
}
