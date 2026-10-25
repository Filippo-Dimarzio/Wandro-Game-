import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  formatDistance,
  regionBySlug,
  TRAIL_UNLOCK_AFTER,
  TRAIL_UNLOCK_COINS,
  trailWalk,
} from '@wandro/shared';
import { CATEGORY_META } from '@/categories';
import { FitImage } from '@/components/FitImage';
import type { TrailView } from '@/data/trails';
import { t } from '@/i18n';
import { radius, shadow, space, useColors } from '@/theme';

/** "1.6 km · about 20 min" for a trail's stops. */
export function trailWalkLabel(trail: TrailView): string {
  const w = trailWalk(trail.stops);
  return t('trail.walk', { distance: formatDistance(w.meters), minutes: w.minutes });
}

/** A trail on Home: its category picture, title, length and how far you've got. */
export function TrailCard({ trail, width }: { trail: TrailView; width: number }) {
  const c = useColors();
  const solved = trail.stops.filter((s) => s.solved).length;
  const status = trail.completedAt
    ? t('trail.finished')
    : trail.startedAt
      ? t('trail.progress', { done: solved, total: trail.stops.length })
      : trail.discoveries < TRAIL_UNLOCK_AFTER
        ? t('trail.lockedShort', {
            count: TRAIL_UNLOCK_AFTER - trail.discoveries,
            city: regionBySlug(trail.region)?.name ?? '',
          })
        : t('trail.unlockShort', { coins: TRAIL_UNLOCK_COINS });
  const stops = t('trail.stops', { count: trail.stops.length });
  const walk = trailWalkLabel(trail);
  const left = Math.max(0, TRAIL_UNLOCK_AFTER - trail.discoveries);
  const city = regionBySlug(trail.region)?.name ?? '';
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/trail/[slug]', params: { slug: trail.slug } })}
      accessibilityRole="button"
      accessibilityLabel={t('trail.cardA11y', { title: trail.title, stops, walk, status })}
      style={[styles.card, shadow, { backgroundColor: c.card, width }]}
      testID={`trail-card-${trail.slug}`}
    >
      <View style={styles.image}>
        <FitImage
          source={CATEGORY_META[trail.theme].art}
          style={StyleSheet.absoluteFill}
          accessible={false}
        />
        <View style={[styles.free, { backgroundColor: c.card }]}>
          <Text style={{ color: c.text, fontWeight: '800', fontSize: 12 }}>
            {trail.startedAt
              ? regionBySlug(trail.region)?.name
              : `🪙 ${t('trail.price', { coins: TRAIL_UNLOCK_COINS })}`}
          </Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
          {trail.title}
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 13 }}>
          {stops} · {walk}
        </Text>
        <View style={styles.status}>
          {trail.completedAt && <Ionicons name="checkmark-circle" size={16} color={c.accent} />}
          {!trail.startedAt && left > 0 && (
            <Ionicons name="lock-closed" size={14} color={c.textMuted} />
          )}
          <Text
            style={{
              color: !trail.startedAt && left > 0 ? c.textMuted : c.accent,
              fontWeight: '800',
            }}
          >
            {trail.completedAt
              ? status
              : trail.startedAt
                ? `${t('trail.continue')} · ${status}`
                : left > 0
                  ? t('trail.lockedShort', { count: left, city })
                  : t('trail.unlockShort', { coins: TRAIL_UNLOCK_COINS })}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 3 / 2 },
  free: {
    position: 'absolute',
    top: space.sm,
    left: space.sm,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  body: { padding: space.md, gap: 4 },
  title: { fontSize: 17, fontWeight: '800' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
});
