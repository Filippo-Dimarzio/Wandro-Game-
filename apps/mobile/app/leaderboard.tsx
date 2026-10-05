import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_REGION, REGIONS, regionFor } from '@wandro/shared';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ME, useLeaderboard, type LeaderboardScope } from '@/data/social';
import { CoinAmount } from '@/components/CoinIcon';
import { t } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { column, radius, space, useColors } from '@/theme';

const SCOPES: LeaderboardScope[] = ['friends', 'region', 'global', 'weekly'];
const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const c = useColors();
  const [scope, setScope] = useState<LeaderboardScope>('friends');
  const loc = useLocation();
  const here = regionFor(loc.position) ?? DEFAULT_REGION;
  const [city, setCity] = useState<string | null>(null);
  const region = REGIONS.find((r) => r.slug === city) ?? here;
  const { rows } = useLeaderboard(scope, region.slug);
  const byChallenges = scope === 'region';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t('leaderboard.title')} />
      <View style={styles.tabs} accessibilityRole="tablist">
        {SCOPES.map((s) => (
          <Pressable
            key={s}
            onPress={() => setScope(s)}
            accessibilityRole="tab"
            accessibilityState={{ selected: scope === s }}
            style={[styles.tab, { backgroundColor: scope === s ? c.accent : c.surface }]}
          >
            <Text style={{ color: scope === s ? c.accentOn : c.text, fontWeight: '700' }}>
              {s === 'region' ? `🏙️ ${t('leaderboard.cities')}` : t(`leaderboard.${s}`)}
            </Text>
          </Pressable>
        ))}
      </View>
      {byChallenges && (
        <View style={styles.tabs} testID="city-picker">
          {REGIONS.map((r) => (
            <Pressable
              key={r.slug}
              onPress={() => setCity(r.slug)}
              accessibilityRole="button"
              accessibilityState={{ selected: r.slug === region.slug }}
              style={[
                styles.city,
                { backgroundColor: r.slug === region.slug ? c.text : c.surface },
              ]}
              testID={`board-city-${r.slug}`}
            >
              <Text style={{ color: r.slug === region.slug ? c.bg : c.text, fontWeight: '700' }}>
                {r.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <Text style={{ color: c.textMuted, paddingHorizontal: space.lg, fontSize: 12 }}>
        {byChallenges ? t('leaderboard.cityNote', { city: region.name }) : t('leaderboard.note')}
      </Text>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.userId}
        contentContainerStyle={[{ padding: space.lg, gap: space.sm }, column]}
        ListEmptyComponent={<Text style={{ color: c.textMuted }}>{t('leaderboard.empty')}</Text>}
        renderItem={({ item }) => (
          <Pressable
            disabled={item.isMe || item.userId === ME}
            onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.userId } })}
            style={[styles.row, { backgroundColor: item.isMe ? c.accent : c.surface }]}
            accessibilityLabel={
              byChallenges
                ? `${item.rank}. ${item.username}, ${t(item.challenges === 1 ? 'leaderboard.challengeOne' : 'leaderboard.challenges', { count: item.challenges })}`
                : `${item.rank}. ${item.username}, ${item.coins} coins`
            }
          >
            <Text style={[styles.rank, { color: item.isMe ? c.accentOn : c.text }]}>
              {MEDALS[item.rank - 1] ?? item.rank}
            </Text>
            <Text style={{ flex: 1, color: item.isMe ? c.accentOn : c.text, fontWeight: '700' }}>
              {item.username}
              {item.isMe ? ` (${t('leaderboard.you')})` : ''}
            </Text>
            {byChallenges ? (
              <Text
                style={{ color: item.isMe ? c.accentOn : c.text, fontWeight: '900' }}
                testID="row-challenges"
              >
                🎯{' '}
                {t(item.challenges === 1 ? 'leaderboard.challengeOne' : 'leaderboard.challenges', {
                  count: item.challenges,
                })}
              </Text>
            ) : (
              <CoinAmount amount={item.coins} color={item.isMe ? c.accentOn : c.gold} />
            )}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    flexWrap: 'wrap',
  },
  tab: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
  },
  city: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    minHeight: 34,
    justifyContent: 'center',
  },
  rank: { width: 32, fontSize: 18, fontWeight: '900', textAlign: 'center' },
});
