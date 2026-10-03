import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { formatDistance, haversineMeters, pointsForVisit } from '@wandro/shared';
import { DailyChallengeCard } from '@/components/DailyChallengeCard';
import { FeedCard } from '@/components/FeedCard';
import { HowToPlay } from '@/components/HowToPlay';
import { categoryIcon } from '@/components/PlaceSheet';
import { ProgressStrip } from '@/components/ProgressStrip';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { useFeed } from '@/data/social';
import { useWallet } from '@/data/wallet';
import { t } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { useSession } from '@/state/session';
import { radius, space, useColors } from '@/theme';

export default function Home() {
  const c = useColors();
  const profile = useSession((s) => s.profile);
  const loc = useLocation();
  const places = usePlaces(loc.position);
  const { ids } = useUnlockedIds();
  const wallet = useWallet();
  const feed = useFeed();
  const list = places.data ?? [];

  const nearby = list
    .filter((p) => !ids.has(p.id))
    .map((p) => ({ p, d: haversineMeters(loc.position, p) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 6);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={places.isRefetching}
            onRefresh={() => {
              places.refetch();
              feed.refetch();
            }}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.brand, { color: c.text }]} accessibilityRole="header">
            Wandro
          </Text>
          <View style={styles.headerIcons}>
            <Pressable
              onPress={() => router.push('/shop')}
              accessibilityRole="button"
              accessibilityLabel={t('coins.a11y', { coins: wallet.coins })}
              style={[styles.coinPill, { backgroundColor: c.surface }]}
              testID="coin-pill"
            >
              <Text style={{ color: c.gold, fontWeight: '900' }}>🪙 {wallet.coins}</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/search')}
              accessibilityRole="button"
              accessibilityLabel={t('home.search')}
              hitSlop={8}
            >
              <Ionicons name="search" size={24} color={c.text} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/leaderboard')}
              accessibilityRole="button"
              accessibilityLabel={t('home.leaderboard')}
              hitSlop={8}
            >
              <Ionicons name="trophy-outline" size={24} color={c.text} />
            </Pressable>
          </View>
        </View>
        <Text style={[styles.greeting, { color: c.text }]}>
          {t('home.greeting', { name: profile?.username ?? '' })}
        </Text>

        {wallet.discoveries === 0 && <HowToPlay />}
        <ProgressStrip wallet={wallet} />
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
          contentContainerStyle={{ gap: space.md }}
        >
          {nearby.map(({ p, d }) => {
            const coins = pointsForVisit(p.category, p.uniqueVisitors, p.basePoints).total;
            return (
              <Pressable
                key={p.id}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/explore', params: { place: p.id } })
                }
                accessibilityRole="button"
                accessibilityLabel={`${p.name}, ${formatDistance(d)}, ${t('coins.a11y', { coins })}`}
                style={styles.nearCard}
              >
                <LinearGradient
                  colors={[c.category[p.category], '#0B2A24']}
                  style={styles.nearPhoto}
                >
                  <Ionicons
                    name={categoryIcon(p.category)}
                    size={30}
                    color="rgba(255,255,255,0.9)"
                  />
                  <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={12} color="#fff" />
                  </View>
                </LinearGradient>
                <Text style={[styles.nearName, { color: c.text }]} numberOfLines={2}>
                  {p.name}
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 13 }}>
                  {formatDistance(d)} · 🪙 {coins}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[styles.section, { color: c.text }]} accessibilityRole="header">
          {t('feed.title')}
        </Text>
        {feed.isLoading && <ActivityIndicator />}
        {feed.items.length === 0 && !feed.isLoading ? (
          <View style={[styles.empty, { backgroundColor: c.surface }]}>
            <Text style={{ color: c.textMuted, textAlign: 'center' }}>{t('feed.empty')}</Text>
            <Pressable
              onPress={() => router.push('/search')}
              accessibilityRole="button"
              style={[styles.emptyButton, { backgroundColor: c.accent }]}
            >
              <Text style={{ color: c.accentOn, fontWeight: '800' }}>{t('feed.findPeople')}</Text>
            </Pressable>
          </View>
        ) : (
          feed.items.map((item) => <FeedCard key={item.id} item={item} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  coinPill: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  brand: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  greeting: { fontSize: 18, fontWeight: '600' },
  section: { fontSize: 20, fontWeight: '800', marginTop: space.sm },
  nearCard: { width: 150, gap: 4 },
  nearPhoto: {
    height: 110,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    padding: 4,
  },
  nearName: { fontWeight: '700' },
  empty: { borderRadius: radius.md, padding: space.lg, gap: space.md, alignItems: 'center' },
  emptyButton: {
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    minHeight: 44,
    justifyContent: 'center',
  },
});
