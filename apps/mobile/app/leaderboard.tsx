import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameBackdrop } from '@/components/GameBackdrop';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ME, useLeaderboard } from '@/data/social';
import { t } from '@/i18n';
import { column, radius, space, useColors } from '@/theme';

const MEDALS = ['🥇', '🥈', '🥉'];

const challengesLabel = (count: number) =>
  t(count === 1 ? 'leaderboard.challengeOne' : 'leaderboard.challenges', { count });

/** One board for all of Portugal, ranked by XP (50 per completed challenge). */
export default function Leaderboard() {
  const c = useColors();
  const { rows } = useLeaderboard('country');
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <GameBackdrop />
      <ScreenHeader title={t('leaderboard.title')} />
      <View style={styles.board}>
        <Text style={[styles.boardName, { color: c.text }]} accessibilityRole="header">
          {t('leaderboard.country')}
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 12 }}>{t('leaderboard.note')}</Text>
      </View>
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
  board: { paddingHorizontal: space.lg, gap: 2 },
  boardName: { fontSize: 20, fontWeight: '900' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
  },
  rank: { width: 32, fontSize: 18, fontWeight: '900', textAlign: 'center' },
});
