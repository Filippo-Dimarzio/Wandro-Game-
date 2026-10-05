import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FriendButton } from '@/components/FriendButton';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { FriendChallengeCard } from '@/components/FriendChallengeCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import {
  useFriendChallenges,
  useFriends,
  useRemoveFriend,
  useRespondFriendRequest,
  type FriendView,
} from '@/data/friends';
import { useSearchProfiles } from '@/data/social';
import { t } from '@/i18n';
import { confirmAction } from '@/lib/confirm';
import { isDemo } from '@/lib/env';
import { column, radius, space, useColors } from '@/theme';

export default function Friends() {
  const c = useColors();
  const { friends, incoming, outgoing } = useFriends();
  const challenges = useFriendChallenges();
  const respond = useRespondFriendRequest();
  const remove = useRemoveFriend();
  const [q, setQ] = useState('');
  const results = useSearchProfiles(q);
  const searching = q.trim().length >= 2 || (isDemo && q.trim().length > 0);
  const sent = challenges.filter((x) => x.direction === 'outgoing');

  const unfriend = async (f: FriendView) => {
    const ok = await confirmAction(
      t('friends.removeTitle', { name: f.username }),
      t('friends.removeBody'),
      t('friends.remove'),
      t('common.cancel'),
    );
    if (ok) remove.mutate(f.id);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t('friends.title')} />
      <ScrollView
        contentContainerStyle={[styles.container, column]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: c.textMuted }}>{t('friends.intro')}</Text>

        <View style={[styles.search, { backgroundColor: c.surface }]}>
          <Ionicons name="person-add-outline" size={18} color={c.textMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t('friends.searchPlaceholder')}
            placeholderTextColor={c.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: c.text }]}
            accessibilityLabel={t('friends.searchPlaceholder')}
            testID="friend-search"
          />
        </View>
        {searching &&
          results.map((r) => (
            <Row key={r.id} userId={r.id} name={r.username} onPress={() => openProfile(r.id)}>
              <FriendButton userId={r.id} compact />
            </Row>
          ))}

        {incoming.length > 0 && (
          <Section title={t('friends.requests', { count: incoming.length })}>
            {incoming.map((f) => (
              <Row
                key={f.id}
                userId={f.id}
                name={f.username}
                sub={f.homeCity}
                onPress={() => openProfile(f.id)}
              >
                <Pressable
                  onPress={() => respond.mutate({ userId: f.id, accept: true })}
                  accessibilityRole="button"
                  style={[styles.pill, { backgroundColor: c.accent }]}
                  testID={`accept-${f.id}`}
                >
                  <Text style={{ color: c.accentOn, fontWeight: '800' }}>
                    {t('friends.accept')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => respond.mutate({ userId: f.id, accept: false })}
                  accessibilityRole="button"
                  accessibilityLabel={t('friends.decline')}
                  style={[styles.icon, { borderColor: c.border }]}
                >
                  <Ionicons name="close" size={18} color={c.text} />
                </Pressable>
              </Row>
            ))}
          </Section>
        )}

        <Section title={t('friends.yourFriends', { count: friends.length })}>
          {friends.length === 0 && <Text style={{ color: c.textMuted }}>{t('friends.empty')}</Text>}
          {friends.map((f) => (
            <Row
              key={f.id}
              userId={f.id}
              name={f.username}
              sub={[t('friends.level', { level: f.level }), f.homeCity].filter(Boolean).join(' · ')}
              onPress={() => openProfile(f.id)}
            >
              <Pressable
                onPress={() => router.push({ pathname: '/challenge/[id]', params: { id: f.id } })}
                accessibilityRole="button"
                accessibilityLabel={t('friends.challengeA11y', { name: f.username })}
                style={[styles.pill, { backgroundColor: c.goldSoft }]}
                testID={`challenge-${f.id}`}
              >
                <Text style={{ color: c.gold, fontWeight: '800' }}>
                  🎯 {t('friends.challenge')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => unfriend(f)}
                accessibilityRole="button"
                accessibilityLabel={t('friends.removeTitle', { name: f.username })}
                style={[styles.icon, { borderColor: c.border }]}
              >
                <Ionicons name="person-remove-outline" size={18} color={c.text} />
              </Pressable>
            </Row>
          ))}
        </Section>

        {outgoing.length > 0 && (
          <Section title={t('friends.pending')}>
            {outgoing.map((f) => (
              <Row
                key={f.id}
                userId={f.id}
                name={f.username}
                sub={f.homeCity}
                onPress={() => openProfile(f.id)}
              >
                <FriendButton userId={f.id} compact />
              </Row>
            ))}
          </Section>
        )}

        {sent.length > 0 && (
          <Section title={t('friends.sentChallenges')}>
            {sent.map((x) => (
              <FriendChallengeCard key={x.id} challenge={x} />
            ))}
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const openProfile = (id: string) => router.push({ pathname: '/user/[id]', params: { id } });

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={{ gap: space.sm }}>
      <Text style={[styles.section, { color: c.text }]} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({
  userId,
  name,
  sub,
  onPress,
  children,
}: {
  userId: string;
  name: string;
  sub?: string | null;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const c = useColors();
  return (
    <View style={[styles.row, { backgroundColor: c.card, borderColor: c.border }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="link"
        style={styles.who}
        accessibilityLabel={sub ? `${name}, ${sub}` : name}
      >
        <PlayerAvatar userId={userId} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontWeight: '800' }} numberOfLines={1}>
            {name}
          </Text>
          {sub ? (
            <Text style={{ color: c.textMuted, fontSize: 13 }} numberOfLines={1}>
              {sub}
            </Text>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.actions}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    minHeight: 48,
  },
  input: { flex: 1, fontSize: 16, minHeight: 44 },
  section: { fontSize: 18, fontWeight: '800' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.sm,
    paddingLeft: space.md,
  },
  who: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: {
    borderRadius: radius.pill,
    minHeight: 40,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
