import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLLECTION_COMPLETION_BONUS, COLLECTION_STEP_BONUS, regionFor } from '@wandro/shared';
import { CITY_ART } from '@/cityArt';
import { AnimatedCard } from '@/components/AnimatedCard';
import { CoinIcon } from '@/components/CoinIcon';
import { PostageStamp } from '@/components/PostageStamp';
import { useCities, type City } from '@/data/cities';
import type { CollectionProgress } from '@/data/collections';
import { t, type TranslationKey } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { column, radius, shadow, space, useColors } from '@/theme';

/** One box per city with its landmark, greyed out until you've discovered a place there. */
export default function Collections() {
  const c = useColors();
  const loc = useLocation();
  const here = regionFor(loc.position)?.slug ?? null;
  const [open, setOpen] = useState<City | null>(null);

  const cities = useCities().sort(
    (a, b) => Number(b.region.slug === here) - Number(a.region.slug === here),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.container, column]}>
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
        <View style={styles.grid}>
          {cities.map((city, i) => (
            <CityBox
              key={city.region.slug}
              city={city}
              index={i}
              isHere={city.region.slug === here}
              onPress={() => setOpen(city)}
            />
          ))}
        </View>
      </ScrollView>
      <CitySheet city={open} onClose={() => setOpen(null)} />
    </SafeAreaView>
  );
}

function CityBox({
  city,
  index,
  isHere,
  onPress,
}: {
  city: City;
  index: number;
  isHere: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  const art = CITY_ART[city.region.slug];
  const fraction = city.total ? city.done / city.total : 0;
  return (
    <AnimatedCard
      index={index}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${city.region.name}, ${t('collections.places', { done: city.done, total: city.total })}${
        city.unlocked ? '' : `, ${t('explore.locked')}`
      }`}
      style={[styles.box, shadow, { backgroundColor: c.card }]}
      contentStyle={styles.boxContent}
      testID={`city-card-${city.region.slug}`}
    >
      {art && (
        <Image
          source={city.unlocked ? art.found : art.locked}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={400}
          accessibilityLabel={t(`landmark.${city.region.slug}` as TranslationKey)}
        />
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.boxTop}>
        {isHere ? (
          <View style={[styles.badge, { backgroundColor: c.accent }]}>
            <Ionicons name="location" size={12} color={c.accentOn} />
            <Text style={[styles.badgeText, { color: c.accentOn }]}>{t('collections.here')}</Text>
          </View>
        ) : (
          <View />
        )}
        {city.unlocked ? (
          <PostageStamp
            region={city.region}
            width={44}
            tilt={6}
            testID={`city-stamp-${city.region.slug}`}
          />
        ) : (
          <View style={styles.lock} testID={`city-locked-${city.region.slug}`}>
            <Ionicons name="lock-closed" size={14} color="#fff" />
          </View>
        )}
      </View>
      <View style={{ gap: 4 }}>
        <Text style={styles.boxName} numberOfLines={1}>
          {city.region.flag} {city.region.name}
        </Text>
        <Text style={styles.boxMeta}>
          {t('collections.places', { done: city.done, total: city.total })}
        </Text>
        <View style={styles.boxTrack}>
          <View style={[styles.boxBar, { width: `${fraction * 100}%` }]} />
        </View>
      </View>
    </AnimatedCard>
  );
}

const native = Platform.OS !== 'web';

/** The city opened up: its landmark, hidden-gem progress and sets, zooming in from the grid. */
function CitySheet({ city, onClose }: { city: City | null; onClose: () => void }) {
  const c = useColors();
  const anim = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState<City | null>(city);

  useEffect(() => {
    if (city) {
      setShown(city);
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: native,
      }).start();
    }
  }, [city, anim]);

  const close = () =>
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: native }).start(() => {
      setShown(null);
      onClose();
    });

  if (!shown) return null;
  const art = CITY_ART[shown.region.slug];
  return (
    <Modal visible transparent animationType="none" onRequestClose={close}>
      <Animated.View style={[styles.scrim, { opacity: anim }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={t('collections.close')}
        />
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: c.bg },
            {
              transform: [
                { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) },
                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
              ],
            },
          ]}
          testID="city-sheet"
        >
          <ScrollView contentContainerStyle={{ paddingBottom: space.xl }}>
            <View style={styles.hero}>
              {art && (
                <Image
                  source={shown.unlocked ? art.found : art.locked}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  accessibilityLabel={t(`landmark.${shown.region.slug}` as TranslationKey)}
                />
              )}
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
                style={StyleSheet.absoluteFill}
              />
              <Pressable
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel={t('collections.close')}
                style={[styles.close, { backgroundColor: c.card }]}
                testID="close-city"
              >
                <Ionicons name="close" size={22} color={c.text} />
              </Pressable>
              <View style={{ padding: space.lg, gap: 2 }}>
                <Text style={styles.heroName} accessibilityRole="header">
                  {shown.region.flag} {shown.region.name}
                </Text>
                <Text style={styles.boxMeta}>
                  {t('collections.places', { done: shown.done, total: shown.total })} ·{' '}
                  {t('collections.sets', { count: shown.sets.length })}
                </Text>
              </View>
            </View>
            {shown.unlocked && (
              <View style={[styles.stampRow, { backgroundColor: c.goldSoft }]}>
                <PostageStamp
                  region={shown.region}
                  value={shown.done}
                  width={104}
                  tilt={-4}
                  animate
                  testID="city-sheet-stamp"
                />
                <Text style={[styles.stampNote, { color: c.text }]}>{t('stamp.collected')}</Text>
              </View>
            )}
            <View style={[styles.notes, { backgroundColor: c.surface }]}>
              {!shown.unlocked && (
                <Row icon="lock-closed" color={c.textMuted}>
                  {t('collections.locked', { city: shown.region.name })}
                </Row>
              )}
              <Row icon="diamond" color={c.gold}>
                {shown.gemsLeft === 0
                  ? t('collections.gemsOpen')
                  : shown.gemsLeft === 1
                    ? t('collections.gemsInOne')
                    : t('collections.gemsIn', { count: shown.gemsLeft })}
              </Row>
            </View>
            {shown.sets.map((set) => (
              <SetRow key={set.id} set={set} />
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function Row({
  icon,
  color,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  children: React.ReactNode;
}) {
  const c = useColors();
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={{ color: c.text, flex: 1 }}>{children}</Text>
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
  stampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    margin: space.lg,
    marginBottom: 0,
    padding: space.md,
    borderRadius: radius.lg,
  },
  stampNote: { flex: 1, fontSize: 18, fontWeight: '900' },
  container: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: space.md,
  },
  box: { width: '48%', aspectRatio: 0.82, borderRadius: radius.lg },
  boxContent: { justifyContent: 'space-between', padding: space.md },
  boxTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
  lock: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14,26,36,0.65)',
  },
  boxName: { color: '#fff', fontSize: 18, fontWeight: '900' },
  boxMeta: { color: '#fff', fontSize: 12, fontWeight: '700' },
  boxTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  boxBar: { height: 4, borderRadius: 2, backgroundColor: '#FFD34D' },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '92%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  hero: { height: 240, justifyContent: 'flex-end' },
  heroName: { color: '#fff', fontSize: 28, fontWeight: '900' },
  close: {
    position: 'absolute',
    top: space.md,
    right: space.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notes: {
    margin: space.lg,
    marginBottom: 0,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  set: {
    marginHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
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
