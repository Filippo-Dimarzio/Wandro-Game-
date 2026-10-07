import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_REGION, REGIONS, regionFor } from '@wandro/shared';
import { GameBackdrop } from '@/components/GameBackdrop';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ME, useLeaderboard, type LeaderboardScope } from '@/data/social';
import { t } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { column, radius, space, useColors } from '@/theme';

const SCOPES: LeaderboardScope[] = ['country', 'region', 'friends'];
const MEDALS = ['🥇', '🥈', '🥉'];

const challengesLabel = (count: number) =>
  t(count === 1 ? 'leaderboard.challengeOne' : 'leaderboard.challenges', { count });

export default function Leaderboard() {
  const c = useColors();
  const [scope, setScope] = useState<LeaderboardScope>('country');
  const loc = useLocation();
  const here = regionFor(loc.position) ?? DEFAULT_REGION;
  const [city, setCity] = useState<string | null>(null);
  const region = REGIONS.find((r) => r.slug === city) ?? here;
  const { rows } = useLeaderboard(scope, region.slug);
  const byCity = scope === 'region';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <GameBackdrop />
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
              {t(`leaderboard.${s}`)}
            </Text>
          </Pressable>
        ))}
      </View>
      {byCity && (
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
        {byCity ? t('leaderboard.cityNote', { city: region.name }) : t('leaderboard.note')}
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
            accessibilityLabel={`${item.rank}. ${item.username}, ${t('leaderboard.xp', { xp: item.xp })}, ${challengesLabel(item.challenges)}`}
          >
            <Text style={[styles.rank, { color: item.isMe ? c.accentOn : c.text }]}>
              {MEDALS[item.rank - 1] ?? item.rank}
            </Text>
            <Text style={{ flex: 1, color: item.isMe ? c.accentOn : c.text, fontWeight: '700' }}>
              {item.username}
              {item.isMe ? ` (${t('leaderboard.you')})` : ''}
            </Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={{ color: item.isMe ? c.accentOn : c.text, fontWeight: '900' }}
                testID="row-xp"
              >
                ⭐ {t('leaderboard.xp', { xp: item.xp })}
              </Text>
              <Text
                style={{ color: item.isMe ? c.accentOn : c.textMuted, fontSize: 12 }}
                testID="row-challenges"
              >
                🎯 {challengesLabel(item.challenges)}
              </Text>
            </View>
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
