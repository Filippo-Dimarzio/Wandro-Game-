import { StyleSheet, Text, View } from 'react-native';
import { levelProgress, octopusStage } from '@wandro/shared';
import { t } from '@/i18n';
import { radius, space, useColors } from '@/theme';

export function ProgressStrip({ points, discoveries }: { points: number; discoveries: number }) {
  const c = useColors();
  // XP mirrors points for now; the server keeps them separately in the ledger.
  const lp = levelProgress(points);
  return (
    <View
      style={[styles.strip, { backgroundColor: c.surface }]}
      accessible
      accessibilityLabel={`${t('home.level', { level: lp.level })}, ${octopusStage(lp.level)}, ${t('home.points', { points })}`}
    >
      <View style={styles.row}>
        <Text style={[styles.level, { color: c.text }]}>
          {'🐙 '}
          {t('home.level', { level: lp.level })} · {octopusStage(lp.level)}
        </Text>
        <Text style={[styles.points, { color: c.accent }]}>{t('home.points', { points })}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: c.border }]}>
        <View
          style={[
            styles.bar,
            { width: `${Math.round(lp.fraction * 100)}%`, backgroundColor: c.accent },
          ]}
        />
      </View>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>
        {lp.xpIntoLevel}/{lp.xpForNext} XP ·{' '}
        {t(discoveries === 1 ? 'home.discoveryOne' : 'home.discoveryMany', { count: discoveries })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { borderRadius: radius.md, padding: space.md, gap: space.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  level: { fontWeight: '700', fontSize: 15 },
  points: { fontWeight: '800', fontSize: 15 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 3 },
});
