import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { FREE_FACTS, formatDistance, haversineMeters, type Place } from '@wandro/shared';
import { t } from '@/i18n';
import { radius, space, useColors } from '@/theme';

/** Only pair places within an easy walk or short hop. */
export const PAIR_MAX_M = 3_000;

/** The closest other visible place, to suggest combining two stops in one outing. */
export function pairFor(place: Place, others: Place[]): { place: Place; distanceM: number } | null {
  let best: { place: Place; distanceM: number } | null = null;
  for (const o of others) {
    if (o.id === place.id || o.hidden) continue;
    const d = haversineMeters(place, o);
    if (d <= PAIR_MAX_M && (!best || d < best.distanceM)) best = { place: o, distanceM: d };
  }
  return best;
}

export function durationLabel(min: number): string {
  return min < 90
    ? t('place.durationMin', { min })
    : t('place.durationHours', { hours: Math.round((min / 60) * 2) / 2 });
}

/** Learn tab: teaser, facts (blurred after the first until discovery) and something to look for. */
export function PlaceLearn({ place, unlocked }: { place: Place; unlocked: boolean }) {
  const c = useColors();
  const d = place.details;
  const color = c.category[place.category];
  if (!d) return <Text style={{ color: c.textMuted }}>{t('place.noFacts')}</Text>;
  return (
    <View style={styles.panel} testID="place-learn">
      <Text style={[styles.teaser, { color: c.text }]}>{d.teaser}</Text>
      {d.facts.map((fact, i) =>
        unlocked || i < FREE_FACTS ? (
          <View key={i} style={styles.fact}>
            <View style={[styles.num, { backgroundColor: color }]}>
              <Text style={{ color: c.onCategory, fontWeight: '900', fontSize: 12 }}>{i + 1}</Text>
            </View>
            <Text style={{ color: c.text, flex: 1, lineHeight: 21 }}>{fact}</Text>
          </View>
        ) : (
          <View
            key={i}
            style={styles.fact}
            accessible
            accessibilityLabel={t('place.factLocked')}
            testID="fact-locked"
          >
            <View style={[styles.num, { backgroundColor: c.border }]}>
              <Ionicons name="lock-closed" size={12} color={c.textMuted} />
            </View>
            {/* Redacted bars instead of the text, so nothing leaks before discovery. */}
            <View style={{ flex: 1, gap: 6 }}>
              <View style={[styles.bar, { backgroundColor: c.border, width: '92%' }]} />
              <View style={[styles.bar, { backgroundColor: c.border, width: '64%' }]} />
            </View>
          </View>
        ),
      )}
      {d.facts.length > FREE_FACTS && !unlocked && (
        <Text style={{ color: c.textMuted, fontSize: 13 }}>{t('place.factLocked')}</Text>
      )}
      {d.lookFor && (
        <View style={[styles.lookFor, { backgroundColor: c.categoryTint[place.category] }]}>
          <Ionicons name="eye-outline" size={18} color={color} />
          <Text style={{ color: c.text, flex: 1 }}>
            <Text style={{ fontWeight: '800', color }}>{t('place.lookFor')}: </Text>
            {d.lookFor}
          </Text>
        </View>
      )}
    </View>
  );
}

/** Plan tab: best time, time needed, cost, access, a practical tip and a place to pair it with. */
export function PlacePlan({ place, others }: { place: Place; others: Place[] }) {
  const c = useColors();
  const d = place.details;
  const pair = pairFor(place, others);
  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [];
  if (d?.bestTime)
    rows.push({ icon: 'sunny-outline', label: t('place.bestTime'), value: d.bestTime });
  if (d?.durationMin)
    rows.push({
      icon: 'hourglass-outline',
      label: t('place.duration'),
      value: durationLabel(d.durationMin),
    });
  if (d?.cost)
    rows.push({ icon: 'ticket-outline', label: t('place.cost'), value: t(`place.cost.${d.cost}`) });
  if (d?.access)
    rows.push({
      icon: 'walk-outline',
      label: t('place.access'),
      value: t(`place.access.${d.access}`),
    });
  if (pair)
    rows.push({
      icon: 'git-merge-outline',
      label: t('place.pairWith'),
      value: t('place.pairWithValue', {
        name: pair.place.name,
        distance: formatDistance(pair.distanceM),
      }),
    });

  if (rows.length === 0 && !d?.tip)
    return <Text style={{ color: c.textMuted }}>{t('place.noPlan')}</Text>;
  return (
    <View style={styles.panel} testID="place-plan">
      {rows.map((r) => (
        <View key={r.label} style={styles.row}>
          <Ionicons name={r.icon} size={18} color={c.category[place.category]} />
          <Text style={{ color: c.textMuted, width: 104, fontWeight: '700' }}>{r.label}</Text>
          <Text style={{ color: c.text, flex: 1 }}>{r.value}</Text>
        </View>
      ))}
      {d?.tip && (
        <View style={[styles.lookFor, { backgroundColor: c.goldSoft }]} testID="place-tip">
          <Ionicons name="alert-circle-outline" size={18} color={c.gold} />
          <Text style={{ color: c.text, flex: 1 }}>
            <Text style={{ fontWeight: '800', color: c.gold }}>{t('place.tip')}: </Text>
            {d.tip}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: space.md },
  teaser: { fontSize: 16, fontWeight: '800', lineHeight: 22 },
  fact: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  num: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  bar: { height: 10, borderRadius: 5 },
  lookFor: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    borderRadius: radius.md,
    padding: space.md,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
});
