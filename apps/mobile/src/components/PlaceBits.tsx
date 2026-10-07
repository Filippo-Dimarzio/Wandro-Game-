import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { formatDistance, pointsForVisit, type Category, type Place } from '@wandro/shared';
import { categoryIcon, placeImage } from '@/categories';
import { AnimatedCard } from '@/components/AnimatedCard';
import { PhotoButton } from '@/components/PhotoSheet';
import { t } from '@/i18n';
import { hoursStatus } from '@/lib/hours';
import { radius, shadow, space, useColors } from '@/theme';

/** Small coloured label with the category icon. */
export function CategoryPill({ category, solid }: { category: Category; solid?: boolean }) {
  const c = useColors();
  const color = c.category[category];
  const fg = solid ? c.onCategory : color;
  return (
    <View
      style={[styles.pill, { backgroundColor: solid ? color : c.categoryTint[category] }]}
      testID={`pill-${category}`}
    >
      <Ionicons name={categoryIcon(category)} size={12} color={fg} />
      <Text style={[styles.pillText, { color: fg }]}>{t(`category.${category}`)}</Text>
    </View>
  );
}

/** "Open now · until 00:30" for places with set times; renders nothing otherwise. */
export function HoursChip({ place, now }: { place: Place; now?: Date }) {
  const c = useColors();
  const status = hoursStatus(place, now);
  if (!status) return null;
  const color = status.open ? c.category.nature : c.textMuted;
  return (
    <View style={styles.hours} testID="hours-chip">
      <Ionicons name="time-outline" size={14} color={color} />
      <Text style={{ color, fontWeight: '700', fontSize: 13 }}>{status.label}</Text>
    </View>
  );
}

interface CardProps {
  place: Place;
  distanceM: number;
  unlocked: boolean;
  onPress: () => void;
  /** Fixed width for horizontal rails; omit to fill the row. */
  width?: number;
  /** Position in a list, to stagger the entrance animation. */
  index?: number;
}

/** Photo-first place card: image, category, name, distance, points and times. */
export function PlaceCard({ place, distanceM, unlocked, onPress, width, index }: CardProps) {
  const c = useColors();
  const points = pointsForVisit(place.category, place.uniqueVisitors, place.basePoints).total;
  return (
    <AnimatedCard
      index={index}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${place.name}, ${t(`category.${place.category}`)}, ${formatDistance(distanceM)}, ${
        unlocked ? t('place.discovered') : t('place.points', { points })
      }`}
      style={[styles.card, shadow, { backgroundColor: c.card, width }]}
    >
      <View style={styles.imageWrap}>
        <Image
          source={placeImage(place)}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessible={false}
        />
        <View style={styles.imageTop}>
          <CategoryPill category={place.category} solid />
          <View
            style={[styles.lock, { backgroundColor: unlocked ? c.accent : 'rgba(14,26,36,0.6)' }]}
          >
            <Ionicons name={unlocked ? 'checkmark' : 'lock-closed'} size={12} color="#fff" />
          </View>
        </View>
        <View style={styles.photo}>
          <PhotoButton place={place} />
        </View>
      </View>
      <View style={styles.body}>
        <Text style={[styles.name, { color: c.text }]} numberOfLines={2}>
          {place.name}
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 13 }}>
          {formatDistance(distanceM)} ·{' '}
          {unlocked ? t('place.discovered') : t('place.points', { points })}
        </Text>
        <HoursChip place={place} />
      </View>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: { fontWeight: '800', fontSize: 12 },
  hours: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  imageWrap: { height: 120, overflow: 'hidden' },
  imageTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: space.sm,
  },
  lock: { borderRadius: 12, padding: 5 },
  photo: { position: 'absolute', right: space.sm, bottom: space.sm },
  body: { padding: space.md, gap: 4 },
  name: { fontWeight: '800', fontSize: 15 },
});
