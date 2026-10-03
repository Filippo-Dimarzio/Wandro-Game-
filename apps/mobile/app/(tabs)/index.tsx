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
import { categoryIcon } from '@/components/PlaceSheet';
import { DailyChallengeCard } from '@/components/DailyChallengeCard';
import { ProgressStrip } from '@/components/ProgressStrip';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { useWallet } from '@/data/wallet';
import { t } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { useSession } from '@/state/session';
import { radius, space, useColors } from '@/theme';

export default function Home() {
  const c = useColors();
  const profile = useSession((s) => s.profile);
  const unlockedMap = useSession((s) => s.unlocked);
  const loc = useLocation();
  const places = usePlaces(loc.position);
  const { ids } = useUnlockedIds();
  const wallet = useWallet();
  const list = places.data ?? [];

  const nearby = list
    .filter((p) => !ids.has(p.id))
    .map((p) => ({ p, d: haversineMeters(loc.position, p) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 6);
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
          <Text style={[styles.brand, { color: c.text }]} accessibilityRole="header">
            Wandro
          </Text>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={c.text}
            accessibilityLabel="Notifications"
          />
        </View>
        <Text style={[styles.greeting, { color: c.text }]}>
          {t('home.greeting', { name: profile?.username ?? '' })}
        </Text>

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
          {nearby.map(({ p, d }) => (
            <Pressable
              key={p.id}
              onPress={() => router.push({ pathname: '/(tabs)/explore', params: { place: p.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${p.name}, ${formatDistance(d)}, ${pointsForVisit(p.category, p.uniqueVisitors, p.basePoints).total} points`}
              style={styles.nearCard}
            >
              <LinearGradient colors={[c.category[p.category], '#0B2A24']} style={styles.nearPhoto}>
                <Ionicons name={categoryIcon(p.category)} size={30} color="rgba(255,255,255,0.9)" />
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={12} color="#fff" />
                </View>
              </LinearGradient>
              <Text style={[styles.nearName, { color: c.text }]} numberOfLines={2}>
                {p.name}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 13 }}>
                {formatDistance(d)} ·{' '}
                {pointsForVisit(p.category, p.uniqueVisitors, p.basePoints).total} pts
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.section, { color: c.text }]} accessibilityRole="header">
          {t('home.recent')}
        </Text>
        {recent.length === 0 ? (
          <Text style={{ color: c.textMuted }}>{t('home.noRecent')}</Text>
        ) : (
          recent.map((r) => (
            <View
              key={r.place!.id}
              style={[styles.post, { backgroundColor: c.card, borderColor: c.border }]}
            >
              <LinearGradient
                colors={[c.category[r.place!.category], '#0B2A24']}
                style={styles.postPhoto}
              >
                <Ionicons
                  name={categoryIcon(r.place!.category)}
                  size={48}
                  color="rgba(255,255,255,0.85)"
                />
              </LinearGradient>
              <View style={{ padding: space.md, gap: 2 }}>
                <Text style={{ color: c.text, fontWeight: '800' }}>
                  {profile?.username} discovered {r.place!.name}
                </Text>
                <Text style={{ color: c.accent, fontWeight: '700' }}>🪙 +{r.points}</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  post: { borderRadius: radius.md, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  postPhoto: { height: 220, alignItems: 'center', justifyContent: 'center' },
});
