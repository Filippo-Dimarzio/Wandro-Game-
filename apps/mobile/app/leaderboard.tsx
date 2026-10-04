import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_REGION, regionFor } from '@wandro/shared';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ME, useLeaderboard, type LeaderboardScope } from '@/data/social';
import { CoinAmount } from '@/components/CoinIcon';
import { t } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { radius, space, useColors } from '@/theme';

const SCOPES: LeaderboardScope[] = ['friends', 'region', 'global', 'weekly'];
const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const c = useColors();
  const [scope, setScope] = useState<LeaderboardScope>('friends');
  const loc = useLocation();
  const region = regionFor(loc.position) ?? DEFAULT_REGION;
  const { rows } = useLeaderboard(scope, region.slug);
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
              {s === 'region' ? `${region.flag} ${region.name}` : t(`leaderboard.${s}`)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ color: c.textMuted, paddingHorizontal: space.lg, fontSize: 12 }}>
        {t('leaderboard.note')}
      </Text>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.userId}
        contentContainerStyle={{ padding: space.lg, gap: space.sm }}
        ListEmptyComponent={<Text style={{ color: c.textMuted }}>{t('leaderboard.empty')}</Text>}
        renderItem={({ item }) => (
          <Pressable
            disabled={item.isMe || item.userId === ME}
            onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.userId } })}
            style={[styles.row, { backgroundColor: item.isMe ? c.accent : c.surface }]}
            accessibilityLabel={`${item.rank}. ${item.username}, ${item.coins} coins`}
          >
            <Text style={[styles.rank, { color: item.isMe ? c.accentOn : c.text }]}>
              {MEDALS[item.rank - 1] ?? item.rank}
            </Text>
            <Text style={{ flex: 1, color: item.isMe ? c.accentOn : c.text, fontWeight: '700' }}>
              {item.username}
              {item.isMe ? ` (${t('leaderboard.you')})` : ''}
            </Text>
            <CoinAmount amount={item.coins} color={item.isMe ? c.accentOn : c.gold} />
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
  rank: { width: 32, fontSize: 18, fontWeight: '900', textAlign: 'center' },
});
