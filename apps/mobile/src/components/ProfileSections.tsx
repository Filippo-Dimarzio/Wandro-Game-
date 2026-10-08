import { StyleSheet, Text, View } from 'react-native';
import {
  BADGE_TIER,
  CATEGORIES,
  explorerClass,
  type BadgeTier,
  type ExplorerStats,
} from '@wandro/shared';
import { CategoryMark } from '@/components/CategoryMark';
import type { EarnedBadge } from '@/data/badges';
import { t } from '@/i18n';
import { radius, space, useColors } from '@/theme';

/** Ring colours for the trophy shelf; the tier is also written out, so colour is never the only cue. */
const TIER_COLOR: Record<BadgeTier, string> = {
  bronze: '#A0612B',
  silver: '#6B7785',
  gold: '#B8860B',
};

/** "Palace Hunter · Level 3": the class comes from the category you discover most. */
export function classTitle(stats: ExplorerStats): string {
  const cls = explorerClass(stats.byCategory);
  return cls ? t(`class.${cls}`) : t('class.none');
}

export function StyleBars({ stats }: { stats: ExplorerStats }) {
  const c = useColors();
  const max = Math.max(1, ...CATEGORIES.map((k) => stats.byCategory[k]));
  if (stats.total === 0)
    return <Text style={{ color: c.textMuted }}>{t('profile.styleEmpty')}</Text>;
  return (
    <View style={{ gap: space.sm }} testID="style-bars">
      {CATEGORIES.map((k) => (
        <View
          key={k}
          style={styles.barRow}
          accessible
          accessibilityLabel={`${t(`category.${k}`)}: ${stats.byCategory[k]}`}
        >
          <CategoryMark category={k} size={28} />
          <Text style={[styles.barLabel, { color: c.text }]} numberOfLines={1}>
            {t(`category.${k}`)}
          </Text>
          <View style={[styles.track, { backgroundColor: c.border }]}>
            <View
              style={[
                styles.fill,
                {
                  width: `${(stats.byCategory[k] / max) * 100}%`,
                  backgroundColor: c.category[k],
                },
              ]}
            />
          </View>
          <Text style={[styles.barCount, { color: c.text }]}>{stats.byCategory[k]}</Text>
        </View>
      ))}
    </View>
  );
}

export function Records({ stats, streak }: { stats: ExplorerStats; streak: number }) {
  const c = useColors();
  const tiles: [string, string, string?][] = [
    [t('profile.recordDiscoveries'), String(stats.total)],
    [t('profile.recordFirsts'), String(stats.firstDiscoveries)],
    [t('profile.recordStreak'), String(streak)],
    stats.rarest
      ? [
          t('profile.recordRarest'),
          stats.rarest.name,
          t('profile.rarestVisitors', { visitors: stats.rarest.visitors }),
        ]
      : [t('profile.recordRarest'), t('profile.rarestNone')],
  ];
  return (
    <View style={styles.records} testID="records">
      {tiles.map(([label, value, sub]) => (
        <View
          key={label}
          style={[styles.record, { backgroundColor: c.surface }]}
          accessible
          accessibilityLabel={`${label}: ${value}${sub ? `, ${sub}` : ''}`}
        >
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }} numberOfLines={2}>
            {value}
          </Text>
          {sub && <Text style={{ color: c.textMuted, fontSize: 12 }}>{sub}</Text>}
        </View>
      ))}
    </View>
  );
}

/** Badges by tier: earned ones ringed in bronze, silver or gold; locked ones show their goal. */
export function TrophyShelf({ badges }: { badges: EarnedBadge[] }) {
  const c = useColors();
  const order: BadgeTier[] = ['gold', 'silver', 'bronze'];
  const sorted = [...badges].sort(
    (a, b) =>
      Number(!!b.awardedAt) - Number(!!a.awardedAt) ||
      order.indexOf(BADGE_TIER[a.code] ?? 'bronze') - order.indexOf(BADGE_TIER[b.code] ?? 'bronze'),
  );
  return (
    <View style={styles.shelf} testID="trophy-shelf">
      {sorted.map((b) => {
        const tier = BADGE_TIER[b.code] ?? 'bronze';
        const earned = !!b.awardedAt;
        return (
          <View
            key={b.code}
            style={[
              styles.trophy,
              { backgroundColor: c.surface, borderColor: earned ? TIER_COLOR[tier] : c.border },
            ]}
            accessible
            accessibilityLabel={
              earned
                ? `${b.name}, ${t(`trophy.${tier}`)}: ${b.description}`
                : `${b.name}, ${t('trophy.locked', { goal: b.description })}`
            }
            testID={`trophy-${b.code}`}
          >
            <Text style={{ fontSize: 28, opacity: earned ? 1 : 0.25 }}>{b.emoji}</Text>
            <Text
              style={{ color: c.text, fontWeight: '700', textAlign: 'center', fontSize: 12 }}
              numberOfLines={2}
            >
              {b.name}
            </Text>
            <Text
              style={{ color: c.textMuted, fontSize: 11, textAlign: 'center' }}
              numberOfLines={4}
            >
              {earned ? t(`trophy.${tier}`) : `🔒 ${b.description}`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  barLabel: { width: 118, fontSize: 12, fontWeight: '700' },
  track: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  barCount: { width: 24, textAlign: 'right', fontWeight: '800' },
  records: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  record: { flexBasis: '47%', flexGrow: 1, borderRadius: radius.md, padding: space.md, gap: 2 },
  shelf: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  trophy: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.md,
    borderWidth: 3,
    padding: space.sm,
  },
});
