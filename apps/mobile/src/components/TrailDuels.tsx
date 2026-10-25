import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TRAIL_DUEL_FINISH_COINS, TRAIL_DUEL_WIN_COINS, trailDuelReward } from '@wandro/shared';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { useFriends } from '@/data/friends';
import {
  trailDuelErrorCode,
  useChallengeTrailDuel,
  useRespondTrailDuel,
  useTrailDuels,
  type TrailDuelView,
} from '@/data/trailDuels';
import type { TrailView } from '@/data/trails';
import { t, type TranslationKey } from '@/i18n';
import { radius, space, useColors } from '@/theme';

/** One line on where a duel stands, from your side. */
export function duelStatusText(d: TrailDuelView): string {
  const name = d.friendUsername;
  switch (d.status) {
    case 'pending':
      return d.direction === 'incoming' ? t('duel.invited', { name }) : t('duel.waiting', { name });
    case 'accepted':
      return t('duel.playing', { name, solved: d.friendSolved, stops: d.stops });
    case 'declined':
      return t('duel.declined', { name });
    case 'done': {
      const mine = d.myScore ?? 0;
      const theirs = d.friendScore ?? 0;
      const coins = trailDuelReward(mine, theirs);
      return mine >= theirs
        ? t('duel.won', { mine, theirs, coins })
        : t('duel.lost', { name, mine, theirs, coins });
    }
  }
}

/** On a trail you've unlocked: challenge a friend, or see how your duels on it stand. */
export function TrailDuelPanel({ trail }: { trail: TrailView }) {
  const c = useColors();
  const { friends } = useFriends();
  const duels = useTrailDuels().filter((d) => d.trailSlug === trail.slug);
  const send = useChallengeTrailDuel();
  // The latest duel with each friend on this trail decides what their row shows.
  const latest = (friendId: string) => duels.find((d) => d.friendId === friendId);

  return (
    <View style={[styles.panel, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
        ⚔️ {t('duel.title')}
      </Text>
      <Text style={{ color: c.textMuted }}>
        {t('duel.explain', { finish: TRAIL_DUEL_FINISH_COINS, win: TRAIL_DUEL_WIN_COINS })}
      </Text>
      {friends.length === 0 && <Text style={{ color: c.textMuted }}>{t('duel.noFriends')}</Text>}
      {friends.map((f) => {
        const d = latest(f.id);
        const open = d && (d.status === 'pending' || d.status === 'accepted');
        return (
          <View key={f.id} style={styles.row} testID={`duel-row-${f.id}`}>
            <PlayerAvatar userId={f.id} size={32} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: '800' }} numberOfLines={1}>
                {f.username}
              </Text>
              {d && <Text style={{ color: c.textMuted, fontSize: 13 }}>{duelStatusText(d)}</Text>}
            </View>
            {!open && (
              <Pressable
                onPress={() => send.mutate({ friendId: f.id, slug: trail.slug })}
                disabled={send.isPending}
                accessibilityRole="button"
                accessibilityLabel={t('duel.challengeA11y', { name: f.username })}
                style={[styles.pill, { backgroundColor: c.goldSoft }]}
                testID={`duel-challenge-${f.id}`}
              >
                <Text style={{ color: c.gold, fontWeight: '800' }}>{t('duel.challenge')}</Text>
              </Pressable>
            )}
          </View>
        );
      })}
      {send.isError && (
        <Text style={{ color: c.danger }} accessibilityLiveRegion="polite">
          {t(`duel.error.${trailDuelErrorCode(send.error)}` as TranslationKey)}
        </Text>
      )}
    </View>
  );
}

/** A duel on the Friends screen: accept or decline one sent to you; tap to open the trail. */
export function TrailDuelCard({ duel }: { duel: TrailDuelView }) {
  const c = useColors();
  const respond = useRespondTrailDuel();
  const status = duelStatusText(duel);
  const incoming = duel.direction === 'incoming' && duel.status === 'pending';
  return (
    <View
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
      testID={`duel-card-${duel.id}`}
    >
      <Pressable
        onPress={() => router.push({ pathname: '/trail/[slug]', params: { slug: duel.trailSlug } })}
        accessibilityRole="link"
        accessibilityLabel={t('duel.cardA11y', { trail: duel.trailTitle, status })}
        style={styles.row}
      >
        <PlayerAvatar userId={duel.friendId} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontWeight: '800' }}>⚔️ {duel.trailTitle}</Text>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>{status}</Text>
        </View>
      </Pressable>
      {incoming && (
        <View style={styles.actions}>
          <Pressable
            onPress={() => respond.mutate({ id: duel.id, accept: true })}
            disabled={respond.isPending}
            accessibilityRole="button"
            accessibilityLabel={t('duel.acceptA11y', {
              name: duel.friendUsername,
              trail: duel.trailTitle,
            })}
            style={[styles.pill, { backgroundColor: c.accent }]}
            testID={`duel-accept-${duel.id}`}
          >
            <Text style={{ color: c.accentOn, fontWeight: '800' }}>{t('duel.accept')}</Text>
          </Pressable>
          <Pressable
            onPress={() => respond.mutate({ id: duel.id, accept: false })}
            disabled={respond.isPending}
            accessibilityRole="button"
            accessibilityLabel={t('duel.declineA11y', {
              name: duel.friendUsername,
              trail: duel.trailTitle,
            })}
            style={[styles.pill, { borderColor: c.border, borderWidth: 1 }]}
            testID={`duel-decline-${duel.id}`}
          >
            <Text style={{ color: c.text, fontWeight: '800' }}>{t('duel.decline')}</Text>
          </Pressable>
        </View>
      )}
      {respond.isError && (
        <Text style={{ color: c.danger }} accessibilityLiveRegion="polite">
          {t(`duel.error.${trailDuelErrorCode(respond.error)}` as TranslationKey)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.md,
    gap: space.sm,
  },
  title: { fontSize: 17, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  pill: {
    minHeight: 40,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.md,
    gap: space.sm,
  },
  actions: { flexDirection: 'row', gap: space.sm, justifyContent: 'flex-end' },
});
