import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES, haversineMeters } from '@wandro/shared';
import { CATEGORY_META, placeImage } from '@/categories';
import { DailyChallengeCard } from '@/components/DailyChallengeCard';
import { CategoryPill, PlaceCard } from '@/components/PlaceBits';
import { ProgressStrip } from '@/components/ProgressStrip';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { t } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { useSession } from '@/state/session';
import { radius, shadow, space, useColors } from '@/theme';

export default function Home() {
  const c = useColors();
  const profile = useSession((s) => s.profile);
  const unlockedMap = useSession((s) => s.unlocked);
  const loc = useLocation();
  const places = usePlaces(loc.position);
  const { ids, totalPoints } = useUnlockedIds();
  const list = places.data ?? [];

  const nearby = list
    .filter((p) => !ids.has(p.id))
    .map((p) => ({ p, d: haversineMeters(loc.position, p) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 8);
  const recent = Object.entries(unlockedMap)
    .sort((a, b) => b[1].at.localeCompare(a[1].at))
    .map(([id, u]) => ({ place: list.find((p) => p.id === id), ...u }))
    .filter((r) => r.place);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={places.isRefetching} onRefresh={() => places.refetch()} />
        }
      >
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: c.accentSoft }]}>
            <Text style={{ fontSize: 22 }} accessible={false}>
              🐙
            </Text>
          </View>
          <Text style={[styles.greeting, { color: c.text }]}>
            {t('home.greeting', { name: profile?.username ?? '' })}
          </Text>
          <View
            style={[styles.bell, shadow, { backgroundColor: c.card }]}
            accessible
            accessibilityLabel={t('home.notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color={c.text} />
          </View>
        </View>
        <Text style={[styles.headline, { color: c.text }]} accessibilityRole="header">
          {t('home.headline')}
        </Text>

        <ProgressStrip points={totalPoints} discoveries={ids.size} />

        <View style={styles.sectionRow}>
          <Text style={[styles.section, { color: c.text }]} accessibilityRole="header">
            {t('home.interests')}
          </Text>
          <Pressable onPress={() => router.push('/discover')} accessibilityRole="link" hitSlop={8}>
            <Text style={{ color: c.accent, fontWeight: '800' }}>{t('home.seeAll')}</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.interests}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() =>
                router.push({ pathname: '/discover/[category]', params: { category: cat } })
              }
              accessibilityRole="button"
              accessibilityLabel={t(`category.${cat}`)}
              style={styles.interest}
              testID={`interest-${cat}`}
            >
              <View style={[styles.interestIcon, { backgroundColor: c.categoryTint[cat] }]}>
                <Ionicons name={CATEGORY_META[cat].icon} size={26} color={c.category[cat]} />
              </View>
              <Text style={[styles.interestLabel, { color: c.text }]} numberOfLines={2}>
                {t(`category.${cat}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <DailyChallengeCard places={list} />

        <Text style={[styles.section, { color: c.text }]} accessibilityRole="header">
          {t('home.nearYou')}
        </Text>
        {places.isLoading && <ActivityIndicator />}
        {places.isError && (
          <Pressable onPress={() => places.refetch()} accessibilityRole="button">
            <Text style={{ color: c.danger }}>
              {t('common.error')} {t('common.retry')}
            </Text>
          </Pressable>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
        >
          {nearby.map(({ p, d }) => (
            <PlaceCard
              key={p.id}
              place={p}
              distanceM={d}
              unlocked={false}
              width={180}
              onPress={() => router.push({ pathname: '/(tabs)/explore', params: { place: p.id } })}
            />
          ))}
        </ScrollView>

        <Text style={[styles.section, { color: c.text }]} accessibilityRole="header">
          {t('home.recent')}
        </Text>
        {recent.length === 0 ? (
          <Text style={{ color: c.textMuted }}>{t('home.noRecent')}</Text>
        ) : (
          recent.map((r) => (
            <View key={r.place!.id} style={[styles.post, shadow, { backgroundColor: c.card }]}>
              <Image
                source={placeImage(r.place!)}
                style={styles.postPhoto}
                contentFit="cover"
                accessible={false}
              />
              <View style={{ padding: space.md, gap: 6 }}>
                <CategoryPill category={r.place!.category} />
                <Text style={{ color: c.text, fontWeight: '800' }}>
                  {t('home.discoveredBy', {
                    name: profile?.username ?? '',
                    place: r.place!.name,
                  })}
                </Text>
                <Text style={{ color: c.category[r.place!.category], fontWeight: '800' }}>
                  +{r.points} pts
                </Text>
              </View>
            </View>
          ))
        )}
        <Text style={{ color: c.textMuted, textAlign: 'center', marginVertical: space.lg }}>
          {t('home.friendsSoon')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: { fontSize: 16, fontWeight: '700', flex: 1 },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: { fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: -space.sm },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.sm,
  },
  section: { fontSize: 20, fontWeight: '800' },
  interests: { gap: space.md, paddingRight: space.lg },
  interest: { width: 76, alignItems: 'center', gap: 6 },
  interestIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  interestLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  rail: { gap: space.md, paddingBottom: space.sm, paddingRight: space.lg },
  post: { borderRadius: radius.lg, overflow: 'hidden' },
  postPhoto: { height: 200 },
});
