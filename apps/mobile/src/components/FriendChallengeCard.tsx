import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CATEGORY_META } from '@/categories';
import { useRespondFriendChallenge, type FriendChallengeView } from '@/data/friends';
import { useReport } from '@/data/social';
import { t } from '@/i18n';
import { radius, shadow, space, useColors } from '@/theme';

/** A friend's "go find this place" challenge, with their note and accept / not now. */
export function FriendChallengeCard({
  challenge: x,
  onShow,
}: {
  challenge: FriendChallengeView;
  /** Show the place on the map; defaults to opening Explore on it. */
  onShow?: () => void;
}) {
  const c = useColors();
  const respond = useRespondFriendChallenge();
  const report = useReport();
  const [reported, setReported] = useState(false);
  const incoming = x.direction === 'incoming';
  const show =
    onShow ?? (() => router.push({ pathname: '/(tabs)/explore', params: { place: x.place.id } }));

  const headline = incoming
    ? t('friends.challengedYou', { name: x.friendUsername })
    : t('friends.youChallenged', { name: x.friendUsername });

  return (
    <View
      style={[styles.card, shadow, { backgroundColor: c.card }]}
      testID={`friend-challenge-${x.id}`}
    >
      <Pressable
        onPress={show}
        accessibilityRole="button"
        accessibilityLabel={`${headline}: ${x.place.name}. ${x.note ?? ''}`}
        style={styles.top}
      >
        <Image
          source={CATEGORY_META[x.place.category].art}
          style={[styles.art, { backgroundColor: c.categoryTint[x.place.category] }]}
          contentFit="cover"
          accessible={false}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
            🎯 {headline}
          </Text>
          <Text style={{ color: c.text, fontWeight: '800' }} numberOfLines={2}>
            {x.place.name}
          </Text>
          <Text
            style={{ color: statusColor(x.status, c), fontSize: 12, fontWeight: '800' }}
            accessibilityLiveRegion="polite"
          >
            {t(`friends.status.${x.status}`)}
          </Text>
        </View>
      </Pressable>

      {x.note ? (
        <Text style={[styles.note, { color: c.text, backgroundColor: c.surface }]}>“{x.note}”</Text>
      ) : null}

      {incoming && x.status === 'pending' && (
        <View style={styles.actions}>
          <Pressable
            onPress={() => respond.mutate({ id: x.id, accept: true })}
            accessibilityRole="button"
            style={[styles.button, { backgroundColor: c.accent }]}
            testID={`accept-challenge-${x.id}`}
          >
            <Text style={{ color: c.accentOn, fontWeight: '800' }}>
              {t('friends.acceptChallenge')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => respond.mutate({ id: x.id, accept: false })}
            accessibilityRole="button"
            style={[styles.button, { borderColor: c.border, borderWidth: 1 }]}
          >
            <Text style={{ color: c.text, fontWeight: '700' }}>{t('friends.notNow')}</Text>
          </Pressable>
        </View>
      )}
      {incoming && x.status === 'accepted' && (
        <Pressable
          onPress={show}
          accessibilityRole="button"
          style={[styles.button, { backgroundColor: c.accentSoft }]}
        >
          <Text style={{ color: c.accent, fontWeight: '800' }}>{t('friends.showOnMap')}</Text>
        </Pressable>
      )}
      {incoming && x.note && !reported && (
        <Pressable
          onPress={() => {
            report.mutate({
              targetType: 'friend_challenge',
              targetId: x.id,
              reason: 'Reported challenge note',
            });
            setReported(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={t('friends.reportNote')}
          hitSlop={8}
          style={styles.flag}
        >
          <Ionicons name="flag-outline" size={14} color={c.textMuted} />
        </Pressable>
      )}
      {reported && <Text style={{ color: c.textMuted, fontSize: 12 }}>{t('feed.reported')}</Text>}
    </View>
  );
}

function statusColor(
  status: FriendChallengeView['status'],
  c: ReturnType<typeof useColors>,
): string {
  if (status === 'completed') return c.accent;
  if (status === 'declined') return c.textMuted;
  return c.gold;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.md, gap: space.sm },
  top: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  art: { width: 56, height: 56, borderRadius: radius.md },
  note: {
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actions: { flexDirection: 'row', gap: space.sm },
  button: {
    flex: 1,
    borderRadius: radius.pill,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  flag: { position: 'absolute', top: space.sm, right: space.sm },
});
