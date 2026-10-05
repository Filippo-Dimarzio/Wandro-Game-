import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { explorerStage } from '@wandro/shared';
import { FriendButton } from '@/components/FriendButton';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useFriendStatus } from '@/data/friends';
import { useBlock, useFollow, useProfileCard, useReport } from '@/data/social';
import { t } from '@/i18n';
import { isDemo } from '@/lib/env';
import { radius, space, useColors } from '@/theme';

export default function UserProfile() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: card } = useProfileCard(id!);
  const follow = useFollow();
  const block = useBlock();
  const report = useReport();
  const [reported, setReported] = useState(false);
  const friendStatus = useFriendStatus(id!);

  if (!card) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader title="" />
        <Text style={{ color: c.textMuted, padding: space.lg }}>{t('user.notFound')}</Text>
      </SafeAreaView>
    );
  }

  const following = card.followStatus !== null;
  const followLabel =
    card.followStatus === 'accepted'
      ? t('user.following')
      : card.followStatus === 'pending'
        ? t('user.requested')
        : t('user.follow');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={card.username} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <PlayerAvatar userId={card.id} size={64} level={card.level} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: c.text, fontSize: 22, fontWeight: '900' }}>{card.username}</Text>
            {card.homeCity ? <Text style={{ color: c.textMuted }}>{card.homeCity}</Text> : null}
            <Text style={{ color: c.accent, fontWeight: '700' }}>
              {t('home.level', { level: card.level })} · {explorerStage(card.level)}
            </Text>
            {isDemo && (
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{t('feed.demoBadge')}</Text>
            )}
          </View>
        </View>

        <View style={styles.stats}>
          <Stat label={t('user.followers')} value={card.followers} />
          <Stat label={t('user.followingCount')} value={card.following} />
          <Stat label={t('user.discoveries')} value={card.discoveries ?? '—'} />
        </View>

        <Pressable
          onPress={() => follow.mutate({ userId: card.id, following })}
          accessibilityRole="button"
          accessibilityState={{ selected: following }}
          style={[styles.follow, { backgroundColor: following ? c.surface : c.accent }]}
          testID="follow-button"
        >
          <Text style={{ color: following ? c.text : c.accentOn, fontWeight: '800' }}>
            {followLabel}
          </Text>
        </Pressable>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <FriendButton userId={card.id} />
          </View>
          {friendStatus === 'friends' && (
            <Pressable
              onPress={() => router.push({ pathname: '/challenge/[id]', params: { id: card.id } })}
              accessibilityRole="button"
              style={[styles.follow, styles.challenge, { backgroundColor: c.goldSoft }]}
              testID="challenge-friend"
            >
              <Text style={{ color: c.gold, fontWeight: '800' }}>🎯 {t('friends.challenge')}</Text>
            </Pressable>
          )}
        </View>

        {!card.canSee && <Text style={{ color: c.textMuted }}>🔒 {t('user.private')}</Text>}

        <View style={styles.row}>
          <Pressable
            onPress={() => {
              report.mutate({
                targetType: 'profile',
                targetId: card.id,
                reason: 'Reported from profile',
              });
              setReported(true);
            }}
            accessibilityRole="button"
            style={[styles.small, { borderColor: c.border }]}
          >
            <Text style={{ color: c.danger, fontWeight: '700' }}>{t('user.report')}</Text>
          </Pressable>
          <Pressable
            onPress={() => block.mutate(card.id)}
            accessibilityRole="button"
            style={[styles.small, { borderColor: c.border }]}
          >
            <Text style={{ color: c.text, fontWeight: '700' }}>{t('user.block')}</Text>
          </Pressable>
        </View>
        {reported && <Text style={{ color: c.textMuted }}>{t('feed.reported')}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  const c = useColors();
  return (
    <View
      style={[styles.stat, { backgroundColor: c.surface }]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={{ color: c.text, fontSize: 20, fontWeight: '900' }}>{value}</Text>
      <Text style={{ color: c.textMuted }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg },
  header: { flexDirection: 'row', gap: space.lg, alignItems: 'center' },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, borderRadius: radius.md, padding: space.md, alignItems: 'center' },
  follow: {
    borderRadius: radius.pill,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', gap: space.sm },
  challenge: { paddingHorizontal: 18 },
  small: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.pill,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
