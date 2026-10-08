import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES, formatDistance, haversineMeters, type Category } from '@wandro/shared';
import { CATEGORY_META, learnKey } from '@/categories';
import { CategoryMark } from '@/components/CategoryMark';
import { PlaceCard } from '@/components/PlaceBits';
import { useDailyChallenge } from '@/data/challenge';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { t, type TranslationKey } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { radius, shadow, space, useColors } from '@/theme';
import { useChallengeIntro } from '@/state/challengeIntro';

type Tab = 'overview' | 'places' | 'learn';
const TABS: { id: Tab; label: TranslationKey }[] = [
  { id: 'overview', label: 'discover.tabOverview' },
  { id: 'places', label: 'discover.tabPlaces' },
  { id: 'learn', label: 'discover.tabLearn' },
];

/** Colour-coded page for one interest: overview, its places, and things to learn. */
export default function CategoryPage() {
  const { category } = useLocalSearchParams<{ category: string }>();
  if (!CATEGORIES.includes(category as Category)) return <Redirect href="/discover" />;
  return <CategoryContent cat={category as Category} />;
}

function CategoryContent({ cat }: { cat: Category }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const loc = useLocation();
  const all = usePlaces(loc.position).data ?? [];
  const { ids } = useUnlockedIds();
  const { challenge } = useDailyChallenge(all);
  const [tab, setTab] = useState<Tab>('overview');

  const color = c.category[cat];
  const tint = c.categoryTint[cat];
  const places = all
    .filter((p) => p.category === cat)
    .map((p) => ({ p, d: haversineMeters(loc.position, p) }))
    .sort((a, b) => a.d - b.d);
  const found = places.filter(({ p }) => ids.has(p.id)).length;
  const nearest = places.find(({ p }) => !ids.has(p.id)) ?? places[0];

  const showIntro = useChallengeIntro((st) => st.show);
  const openOnMap = (placeId?: string) =>
    router.push({
      pathname: '/(tabs)/explore',
      params: placeId ? { place: placeId, category: cat } : { category: cat },
    });

  return (
    <View style={{ flex: 1, backgroundColor: tint }} testID={`category-page-${cat}`}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl + insets.bottom }}>
        <View style={styles.hero}>
          <Image
            source={CATEGORY_META[cat].art}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            accessible={false}
          />
          <View style={[styles.heroBar, { top: insets.top + space.sm }]}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/discover'))}
              accessibilityRole="button"
              accessibilityLabel={t('discover.back')}
              style={[styles.round, shadow, { backgroundColor: c.card }]}
            >
              <Ionicons name="arrow-back" size={22} color={c.text} />
            </Pressable>
            <Pressable
              onPress={() => openOnMap()}
              accessibilityRole="button"
              accessibilityLabel={t('discover.onMap')}
              style={[styles.round, shadow, { backgroundColor: c.card }]}
            >
              <Ionicons name="map" size={20} color={color} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.sheet, { backgroundColor: c.card }]}>
          <View style={styles.titleRow}>
            <CategoryMark category={cat} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color }]} accessibilityRole="header">
                {t(`category.${cat}`)}
              </Text>
              <Text style={{ color: c.textMuted, fontWeight: '600' }}>
                {t('discover.placeCount', { count: places.length })}
              </Text>
            </View>
          </View>

          <View style={styles.tabs} accessibilityRole="tablist">
            {TABS.map((x) => {
              const on = tab === x.id;
              return (
                <Pressable
                  key={x.id}
                  onPress={() => setTab(x.id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  style={styles.tab}
                >
                  <Text style={{ color: on ? color : c.textMuted, fontWeight: on ? '800' : '600' }}>
                    {t(x.label)}
                  </Text>
                  <View style={[styles.tabBar, { backgroundColor: on ? color : 'transparent' }]} />
                </Pressable>
              );
            })}
          </View>

          {tab === 'overview' && (
            <View style={styles.section}>
              <Text style={[styles.lead, { color: c.text }]}>{t(learnKey(cat, 'intro'))}</Text>
              <View style={[styles.stats, { borderColor: c.border }]}>
                {[
                  {
                    icon: 'location' as const,
                    label: t('discover.statPlaces'),
                    value: `${places.length}`,
                  },
                  {
                    icon: 'checkmark-circle' as const,
                    label: t('discover.statFound'),
                    value: `${found}/${places.length}`,
                  },
                  {
                    icon: 'walk' as const,
                    label: t('discover.statNearest'),
                    value: nearest ? formatDistance(nearest.d) : '–',
                  },
                ].map((s, i) => (
                  <View
                    key={s.label}
                    style={[styles.stat, i > 0 && { borderLeftWidth: 1, borderColor: c.border }]}
                    accessible
                    accessibilityLabel={`${s.label}: ${s.value}`}
                  >
                    <Text style={{ color: c.textMuted, fontSize: 12 }}>{s.label}</Text>
                    <View style={styles.statValue}>
                      <Ionicons name={s.icon} size={16} color={color} />
                      <Text style={{ color: c.text, fontWeight: '800' }}>{s.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
              {challenge?.category === cat && !challenge.completedAt && (
                <View style={[styles.banner, { backgroundColor: c.goldSoft }]}>
                  <Ionicons name="flash" size={16} color={c.gold} />
                  <Text style={{ color: c.gold, fontWeight: '800', flex: 1 }}>
                    {t('discover.challengeMatch')}
                  </Text>
                </View>
              )}
              {nearest && (
                <PlaceCard
                  place={nearest.p}
                  distanceM={nearest.d}
                  unlocked={ids.has(nearest.p.id)}
                  onPress={() => showIntro(nearest.p)}
                />
              )}
            </View>
          )}

          {tab === 'places' && (
            <View style={styles.section}>
              {places.length === 0 && (
                <Text style={{ color: c.textMuted }}>{t('discover.empty')}</Text>
              )}
              {places.map(({ p, d }, i) => (
                <PlaceCard
                  index={i}
                  key={p.id}
                  place={p}
                  distanceM={d}
                  unlocked={ids.has(p.id)}
                  onPress={() => showIntro(p)}
                />
              ))}
            </View>
          )}

          {tab === 'learn' && (
            <View style={styles.section}>
              <Text style={[styles.h2, { color: c.text }]} accessibilityRole="header">
                {t('discover.didYouKnow')}
              </Text>
              {(['fact1', 'fact2', 'fact3'] as const).map((f, i) => (
                <View key={f} style={[styles.fact, { backgroundColor: tint }]}>
                  <View style={[styles.num, { backgroundColor: color }]}>
                    <Text style={{ color: c.onCategory, fontWeight: '900' }}>{i + 1}</Text>
                  </View>
                  <Text style={{ color: c.text, flex: 1, lineHeight: 20 }}>
                    {t(learnKey(cat, f))}
                  </Text>
                </View>
              ))}
              <Text style={[styles.h2, { color: c.text }]} accessibilityRole="header">
                {t('discover.goodToKnow')}
              </Text>
              <View style={[styles.fact, styles.tip, { borderColor: color }]}>
                <Ionicons name="shield-checkmark" size={22} color={color} />
                <Text style={{ color: c.text, flex: 1, lineHeight: 20 }}>
                  {t(learnKey(cat, 'tip'))}
                </Text>
              </View>
            </View>
          )}

          <Pressable
            onPress={() => openOnMap()}
            accessibilityRole="button"
            style={[styles.cta, { backgroundColor: color }]}
          >
            <Ionicons name="map" size={18} color={c.onCategory} />
            <Text style={{ color: c.onCategory, fontWeight: '800', fontSize: 16 }}>
              {t('discover.onMap')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 260 },
  heroBar: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    marginTop: -space.xl,
    marginHorizontal: space.md,
    borderRadius: radius.xl,
    padding: space.lg,
    gap: space.lg,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { fontSize: 26, fontWeight: '900' },
  tabs: { flexDirection: 'row', justifyContent: 'space-around' },
  tab: { alignItems: 'center', gap: 6, minHeight: 44, justifyContent: 'center', flex: 1 },
  tabBar: { height: 3, width: 28, borderRadius: 2 },
  section: { gap: space.md },
  lead: { fontSize: 16, lineHeight: 23 },
  stats: { flexDirection: 'row', borderWidth: 1, borderRadius: radius.md },
  stat: { flex: 1, padding: space.sm, gap: 4, alignItems: 'center' },
  statValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    padding: space.md,
  },
  h2: { fontSize: 18, fontWeight: '900' },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.md,
    padding: space.md,
  },
  tip: { borderWidth: 1.5 },
  num: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.pill,
    minHeight: 52,
  },
});
