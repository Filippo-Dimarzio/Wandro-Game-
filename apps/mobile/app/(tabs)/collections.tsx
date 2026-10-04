import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  COLLECTION_COMPLETION_BONUS,
  COLLECTION_STEP_BONUS,
  REGIONS,
  regionFor,
  type Region,
} from '@wandro/shared';
import { CATEGORY_META } from '@/categories';
import { CoinIcon } from '@/components/CoinIcon';
import { useCollections, type CollectionProgress } from '@/data/collections';
import { t } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { radius, shadow, space, useColors } from '@/theme';

interface City {
  region: Region;
  sets: CollectionProgress[];
  done: number;
  total: number;
}

/** Sets grouped into one card per city; tapping a city opens it. */
export default function Collections() {
  const c = useColors();
  const loc = useLocation();
  const here = regionFor(loc.position)?.slug ?? null;
  const collections = useCollections();
  const [open, setOpen] = useState<string | null>(here);

  const cities: City[] = REGIONS.flatMap((region) => {
    const sets = collections.filter((s) => s.region === region.slug);
    if (!sets.length) return [];
    return [
      {
        region,
        sets,
        done: sets.reduce((a, s) => a + s.done, 0),
        total: sets.reduce((a, s) => a + s.total, 0),
      },
    ];
  }).sort(
    (a, b) =>
      Number(b.region.slug === here) - Number(a.region.slug === here) ||
      Number(b.done > 0) - Number(a.done > 0),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
            {t('collections.title')}
          </Text>
          <Pressable
            onPress={() => router.push('/leaderboard')}
            accessibilityRole="button"
            accessibilityLabel={t('home.leaderboard')}
            hitSlop={8}
          >
            <Ionicons name="trophy-outline" size={24} color={c.text} />
          </Pressable>
        </View>
        <Text style={{ color: c.textMuted }}>
          {t('collections.subtitle', {
            step: COLLECTION_STEP_BONUS,
            bonus: COLLECTION_COMPLETION_BONUS,
          })}
        </Text>
        {cities.map((city) => (
          <CityCard
            key={city.region.slug}
            city={city}
            isHere={city.region.slug === here}
            open={open === city.region.slug}
            onToggle={() => setOpen((o) => (o === city.region.slug ? null : city.region.slug))}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function CityCard({
  city,
  isHere,
  open,
  onToggle,
}: {
  city: City;
  isHere: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const c = useColors();
  const anim = useRef(new Animated.Value(open ? 1 : 0)).current;
  // Keep the sets mounted while the card closes so they can animate out.
  const [shown, setShown] = useState(open);

  useEffect(() => {
    if (open) setShown(true);
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => finished && !open && setShown(false));
  }, [open, anim]);

  const coverHeight = anim.interpolate({ inputRange: [0, 1], outputRange: [96, 150] });
  const zoom = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const chevron = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  // A mosaic of the city's own categories, so each city card looks different.
  const mosaic = [...new Set(city.sets.flatMap((s) => s.places.map((p) => p.category)))].slice(
    0,
    3,
  );
  const fraction = city.total ? city.done / city.total : 0;

  return (
    <View
      style={[styles.card, shadow, { backgroundColor: c.card }]}
      testID={`city-card-${city.region.slug}`}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${city.region.name}, ${t('collections.places', { done: city.done, total: city.total })}`}
      >
        <Animated.View style={[styles.cover, { height: coverHeight }]}>
          <Animated.View style={[styles.mosaic, { transform: [{ scale: zoom }] }]}>
            {mosaic.map((cat) => (
              <Image
                key={cat}
                source={CATEGORY_META[cat].art}
                style={styles.mosaicPart}
                contentFit="cover"
                accessible={false}
              />
            ))}
          </Animated.View>
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.65)']}
            style={StyleSheet.absoluteFill}
          />
          {isHere && (
            <View style={[styles.here, { backgroundColor: c.accent }]}>
              <Ionicons name="location" size={12} color={c.accentOn} />
              <Text style={{ color: c.accentOn, fontSize: 12, fontWeight: '800' }}>
                {t('collections.here')}
              </Text>
            </View>
          )}
          <View style={styles.coverRow}>
            <Text style={{ fontSize: 28 }} accessible={false}>
              {city.region.flag}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.city}>{city.region.name}</Text>
              <Text style={styles.cityMeta}>
                {t('collections.places', { done: city.done, total: city.total })} ·{' '}
                {t('collections.sets', { count: city.sets.length })}
              </Text>
            </View>
            <Animated.View style={{ transform: [{ rotate: chevron }] }}>
              <Ionicons name="chevron-down" size={24} color="#fff" />
            </Animated.View>
          </View>
          <View style={styles.cityTrack}>
            <View style={[styles.cityBar, { width: `${fraction * 100}%` }]} />
          </View>
        </Animated.View>
      </Pressable>

      {shown && (
        <Animated.View
          style={{
            opacity: anim,
            transform: [
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) },
            ],
          }}
        >
          {city.sets.map((set) => (
            <SetRow key={set.id} set={set} />
          ))}
        </Animated.View>
      )}
    </View>
  );
}

function SetRow({ set }: { set: CollectionProgress }) {
  const c = useColors();
  const color = c.category[set.theme];
  const fraction = set.total ? set.done / set.total : 0;
  return (
    <View
      style={[styles.set, { borderTopColor: c.border }]}
      accessible={false}
      testID={`set-${set.id}`}
    >
      <View style={styles.setHead}>
        <Text style={{ color: c.text, fontWeight: '900', fontSize: 16, flex: 1 }}>
          {set.completed ? '🏆 ' : ''}
          {set.title}
        </Text>
        <Text style={{ color, fontWeight: '900' }}>
          {set.done}/{set.total}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: c.border }]}>
        <View style={[styles.bar, { width: `${fraction * 100}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.reward}>
        <CoinIcon size={14} />
        <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700' }}>
          {set.completed
            ? t('collections.completed')
            : t('collections.reward', { step: set.stepBonus, bonus: set.bonus })}
        </Text>
      </View>
      <View style={styles.chips}>
        {set.places.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => router.push({ pathname: '/(tabs)/explore', params: { place: p.id } })}
            accessibilityRole="link"
            accessibilityLabel={`${p.name}${p.found ? `, ${t('collections.completed')}` : ''}`}
            style={[
              styles.chip,
              { backgroundColor: p.found ? c.categoryTint[p.category] : c.surface },
            ]}
          >
            <Ionicons
              name={p.found ? 'checkmark-circle' : 'ellipse-outline'}
              size={14}
              color={p.found ? c.category[p.category] : c.textMuted}
            />
            <Text style={{ color: c.text, fontSize: 13 }} numberOfLines={1}>
              {p.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900' },
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  cover: { justifyContent: 'flex-end', overflow: 'hidden' },
  mosaic: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    gap: 2,
  },
  mosaicPart: { flex: 1 },
  coverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
  },
  city: { color: '#fff', fontSize: 22, fontWeight: '900' },
  cityMeta: { color: '#fff', fontSize: 13, fontWeight: '600' },
  cityTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  cityBar: { height: 4, backgroundColor: '#FFD34D' },
  here: {
    position: 'absolute',
    top: space.sm,
    left: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  set: { padding: space.md, gap: space.sm, borderTopWidth: StyleSheet.hairlineWidth },
  setHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  bar: { height: 6 },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    minHeight: 32,
    maxWidth: '100%',
  },
});
