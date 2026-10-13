import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Children, cloneElement, isValidElement, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  CATEGORIES,
  formatDistance,
  pointsForVisit,
  type Category,
  type Place,
} from '@wandro/shared';
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

/**
 * Portrait place card for two-column grids, styled like the city collection cards: the picture
 * fills the card and the name sits on a dark fade at the bottom so it stays readable on any art.
 */
export function PlaceTile({ place, distanceM, unlocked, onPress, index = 0, width }: CardProps) {
  const c = useColors();
  const tone = TILE_TONES[index % TILE_TONES.length]!;
  // Start from the place's own category colour, then rotate through the others.
  const own = CATEGORIES.indexOf(place.category);
  const washColor = c.category[CATEGORIES[(own + index) % CATEGORIES.length]!];
  const points = pointsForVisit(place.category, place.uniqueVisitors, place.basePoints).total;
  return (
    <AnimatedCard
      index={index}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${place.name}, ${t(`category.${place.category}`)}, ${formatDistance(distanceM)}, ${
        unlocked ? t('place.discovered') : t('place.points', { points })
      }`}
      style={[styles.tile, shadow, { backgroundColor: c.card }, width ? { width } : null]}
      testID={`place-tile-${place.id}`}
    >
      {/* Places in a category often share one illustration: a different wash of the category
          colour and a different crop per card keeps a long grid from repeating itself. */}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: washColor, opacity: tone.wash }]}
        testID="tile-wash"
      />
      <Image
        source={placeImage(place)}
        style={[StyleSheet.absoluteFill, { opacity: TILE_IMAGE_OPACITY }]}
        contentFit="cover"
        contentPosition={tone.crop}
        accessible={false}
      />
      <LinearGradient
        colors={['rgba(14,26,36,0)', 'rgba(14,26,36,0.88)']}
        locations={[0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.tileTop}>
        <View
          style={[styles.lock, { backgroundColor: unlocked ? c.accent : 'rgba(14,26,36,0.6)' }]}
        >
          <Ionicons name={unlocked ? 'checkmark' : 'lock-closed'} size={12} color="#fff" />
        </View>
        <PhotoButton place={place} />
      </View>
      <View style={styles.tileBody}>
        <Text style={styles.tileName} numberOfLines={3}>
          {place.name}
        </Text>
        <Text style={styles.tileMeta} numberOfLines={1}>
          {formatDistance(distanceM)} ·{' '}
          {unlocked ? t('place.discovered') : t('place.points', { points })}
        </Text>
      </View>
    </AnimatedCard>
  );
}

/** The card art shows through at 60% (40% transparent) over the colour wash. */
export const TILE_IMAGE_OPACITY = 0.6;
const TILE_TONES = [
  { wash: 1, crop: 'center' },
  { wash: 0.75, crop: 'top' },
  { wash: 0.9, crop: 'bottom' },
  { wash: 0.65, crop: 'left' },
  { wash: 0.85, crop: 'right' },
] as const;

/** Tiles are never wider than a city collection card (half of the 600 px column, less the gap). */
export const TILE_MAX_WIDTH = 288;

/**
 * Grid of place tiles: two columns on phones, more on wide screens, so a tile is never bigger
 * than a collection card.
 */
export function PlaceGrid({ children }: { children: ReactNode }) {
  const [width, setWidth] = useState(0);
  const gap = space.md;
  const cols = Math.max(2, Math.ceil((width + gap) / (TILE_MAX_WIDTH + gap)));
  const tile = width ? Math.floor((width - gap * (cols - 1)) / cols) : undefined;
  return (
    <View
      style={[styles.grid, { gap }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      testID="place-grid"
    >
      {Children.map(children, (child) =>
        isValidElement<CardProps>(child) ? cloneElement(child, { width: tile }) : child,
      )}
    </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { width: '48%', aspectRatio: 0.82, borderRadius: radius.lg, overflow: 'hidden' },
  tileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: space.sm,
  },
  tileBody: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.md, gap: 2 },
  tileName: { color: '#fff', fontWeight: '900', fontSize: 16, lineHeight: 20 },
  tileMeta: { color: 'rgba(255,255,255,0.88)', fontWeight: '700', fontSize: 12 },
});
