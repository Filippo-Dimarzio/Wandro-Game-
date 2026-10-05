import { Ionicons } from '@expo/vector-icons';
import { ThemeToggle } from '@/components/ThemeToggle';
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
import { CategoryMark } from '@/components/CategoryMark';
import { CoinCounter } from '@/components/CoinCounter';
import { ExplorerAvatar } from '@/components/ExplorerAvatar';
import { DailyChallengeCard } from '@/components/DailyChallengeCard';
import { HowToPlay } from '@/components/HowToPlay';
import { InstallBanner } from '@/components/InstallBanner';
import { JoinBetaCard } from '@/components/JoinBetaCard';
import { PlaceCard } from '@/components/PlaceBits';
import { ProgressStrip } from '@/components/ProgressStrip';
import { useMyExplorer } from '@/data/explorer';
import { useFriendChallenges, useFriends } from '@/data/friends';
import { useLoadout } from '@/data/loadout';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { useWallet } from '@/data/wallet';
import { t } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { useSession } from '@/state/session';
import { column, radius, space, useColors } from '@/theme';

export default function Home() {
  const c = useColors();
  const profile = useSession((s) => s.profile);
  const loc = useLocation();
  const places = usePlaces(loc.position);
  const { ids } = useUnlockedIds();
  const wallet = useWallet();
  const explorer = useMyExplorer();
  const loadout = useLoadout();
  const { incoming } = useFriends();
  const friendChallenges = useFriendChallenges();
  const friendNews =
    incoming.length +
    friendChallenges.filter((x) => x.direction === 'incoming' && x.status === 'pending').length;
  const list = places.data ?? [];

  const nearby = list
    .filter((p) => !ids.has(p.id))
    .map((p) => ({ p, d: haversineMeters(loc.position, p) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 8);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.container, column]}
        refreshControl={
          <RefreshControl
            refreshing={places.isRefetching}
            onRefresh={() => {
              places.refetch();
            }}
          />
        }
      >
        <View style={styles.header}>
          <ExplorerAvatar explorer={explorer} skin={loadout.skin} hat={loadout.hat} size={40} />
          <Text style={[styles.greeting, { color: c.text }]} numberOfLines={1}>
            {t('home.greeting', { name: profile?.username ?? '' })}
          </Text>
          <View style={styles.headerIcons}>
            <Pressable
              onPress={() => router.push('/shop')}
              accessibilityRole="button"
              accessibilityLabel={t('coins.a11y', { coins: wallet.coins })}
              style={[styles.coinPill, { backgroundColor: c.surface }]}
              testID="coin-pill"
            >
              <CoinCounter coins={wallet.coins} />
            </Pressable>
            <ThemeToggle />
            <Pressable
              onPress={() => router.push('/friends')}
              accessibilityRole="button"
              accessibilityLabel={
                friendNews > 0
                  ? `${t('home.friends')}, ${t('friends.requests', { count: friendNews })}`
                  : t('home.friends')
              }
              hitSlop={8}
              testID="friends-button"
            >
              <Ionicons name="people-outline" size={24} color={c.text} />
              {friendNews > 0 && (
                <View style={[styles.badge, { backgroundColor: c.danger }]}>
                  <Text style={styles.badgeText}>{friendNews}</Text>
                </View>
              )}
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
        <Text style={[styles.headline, { color: c.text }]} accessibilityRole="header">
          {t('home.headline')}
        </Text>

        <InstallBanner />
        {wallet.discoveries === 0 && <HowToPlay />}
        <ProgressStrip wallet={wallet} />

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
              <CategoryMark category={cat} size={64} />
              <Text style={[styles.interestLabel, { color: c.text }]} numberOfLines={2}>
                {t(`category.${cat}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <DailyChallengeCard places={list} unlocked={ids} near={loc.position} />
        <JoinBetaCard />

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
          {nearby.map(({ p, d }, i) => (
            <PlaceCard
              index={i}
              key={p.id}
              place={p}
              distanceM={d}
              unlocked={false}
              width={180}
              onPress={() => router.push({ pathname: '/(tabs)/explore', params: { place: p.id } })}
            />
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  coinPill: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  greeting: { fontSize: 16, fontWeight: '700', flex: 1 },
  headline: { fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginTop: -space.sm },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.sm,
  },
  section: { fontSize: 20, fontWeight: '800' },
  interests: { gap: space.md, paddingRight: space.lg },
  interest: { width: 80, alignItems: 'center', gap: 6 },
  interestLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  rail: { gap: space.md, paddingBottom: space.sm, paddingRight: space.lg },
});
