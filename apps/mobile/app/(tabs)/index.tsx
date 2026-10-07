import { Ionicons } from '@expo/vector-icons';
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
import { haversineMeters } from '@wandro/shared';
import { GameBackdrop } from '@/components/GameBackdrop';
import { CoinCounter } from '@/components/CoinCounter';
import { DailyChallengeCard } from '@/components/DailyChallengeCard';
import { ExplorerAvatar } from '@/components/ExplorerAvatar';
import { HomeTip } from '@/components/HomeTip';
import { InterestStories } from '@/components/InterestStories';
import { PlaceCard } from '@/components/PlaceBits';
import { StreakFlame } from '@/components/Streak';
import { useMyExplorer } from '@/data/explorer';
import { useFriendChallenges, useFriends } from '@/data/friends';
import { useLoadout } from '@/data/loadout';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { useWallet } from '@/data/wallet';
import { t } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { useSession } from '@/state/session';
import { column, radius, space, useColors } from '@/theme';

/** How many nearby places Home shows; the rest are one tap away on the Nearby page. */
const HOME_NEARBY = 3;

/**
 * Home answers "what do I do today?": today's challenge, the next places to discover and the
 * interests to browse. Everything else (progress, leaderboards, settings, how to play) is a tap
 * away on Profile.
 */
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
    .slice(0, HOME_NEARBY);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <GameBackdrop />
      <ScrollView
        contentContainerStyle={[styles.container, column]}
        refreshControl={
          <RefreshControl refreshing={places.isRefetching} onRefresh={() => places.refetch()} />
        }
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityRole="button"
            accessibilityLabel={t('profile.progress')}
            hitSlop={6}
          >
            <ExplorerAvatar explorer={explorer} skin={loadout.skin} hat={loadout.hat} size={40} />
          </Pressable>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.greeting, { color: c.text }]} numberOfLines={1}>
              {t('home.greeting', { name: profile?.username ?? '' })}
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              accessibilityRole="button"
              accessibilityLabel={t('home.progressA11y', {
                level: wallet.level,
                streak: wallet.streak,
              })}
              style={[styles.levelChip, { backgroundColor: c.accentSoft }]}
              testID="level-chip"
            >
              <Text style={{ color: c.accent, fontWeight: '800', fontSize: 12 }}>
                {t('home.levelChip', { level: wallet.level })}
              </Text>
            </Pressable>
          </View>
          <View style={styles.headerIcons}>
            <StreakFlame />
            <Pressable
              onPress={() => router.push('/shop')}
              accessibilityRole="button"
              accessibilityLabel={t('coins.a11y', { coins: wallet.coins })}
              style={[styles.coinPill, { backgroundColor: c.surface }]}
              testID="coin-pill"
            >
              <CoinCounter coins={wallet.coins} />
            </Pressable>
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
          </View>
        </View>

        <InterestStories places={list} unlocked={ids} />

        <HomeTip discoveries={wallet.discoveries} />

        <DailyChallengeCard places={list} unlocked={ids} near={loc.position} />

        <View style={styles.sectionRow}>
          <Text style={[styles.section, { color: c.text }]} accessibilityRole="header">
            {t('home.nearYou')}
          </Text>
          <Pressable
            onPress={() => router.push('/nearby')}
            accessibilityRole="link"
            hitSlop={8}
            testID="see-all-nearby"
          >
            <Text style={{ color: c.accent, fontWeight: '800' }}>{t('home.seeAllNearby')}</Text>
          </Pressable>
        </View>
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
              width={200}
              onPress={() => router.push({ pathname: '/(tabs)/explore', params: { place: p.id } })}
            />
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
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
  levelChip: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  greeting: { fontSize: 16, fontWeight: '800' },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.xs,
  },
  section: { fontSize: 20, fontWeight: '800' },
  rail: { gap: space.md, paddingBottom: space.sm, paddingRight: space.lg },
});
