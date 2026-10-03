import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  haversineMeters,
  type HiddenHint,
  type LatLng,
  type Place,
  type Region,
} from '@wandro/shared';
import { DailyChallengeCard } from '@/components/DailyChallengeCard';
import { FriendChallengeCard } from '@/components/FriendChallengeCard';
import { PlaceCard } from '@/components/PlaceBits';
import { useFriendChallenges, type FriendChallengeView } from '@/data/friends';
import { t } from '@/i18n';
import { radius, shadow, space, useColors } from '@/theme';

export const SIDEBAR_WIDTH = 340;

interface Props {
  places: Place[];
  unlockedIds: Set<string>;
  position: LatLng;
  region: Region | null;
  hidden: { count: number; hint: HiddenHint | null };
  onSelect: (place: Place) => void;
  /** Show a friend's challenge place even when it isn't loaded (another city). */
  onShowChallenge: (c: FriendChallengeView) => void;
  onPickCity: () => void;
  /** Phones only: the panel can be closed; docked panels can't. */
  onClose?: () => void;
}

/** Everything there is to do right now: today's challenge, friends' challenges, the gem, nearby. */
export function ChallengeSidebar({
  places,
  unlockedIds,
  position,
  region,
  hidden,
  onSelect,
  onShowChallenge,
  onPickCity,
  onClose,
}: Props) {
  const c = useColors();
  const challenges = useFriendChallenges().filter(
    (x) => x.direction === 'incoming' && (x.status === 'pending' || x.status === 'accepted'),
  );
  const next = places
    .filter((p) => !unlockedIds.has(p.id))
    .map((p) => ({ p, d: haversineMeters(position, p) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 5);

  return (
    <View style={[styles.panel, { backgroundColor: c.bg, borderRightColor: c.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
          🧭 {t('sidebar.title')}
        </Text>
        <Pressable
          onPress={onPickCity}
          accessibilityRole="button"
          accessibilityLabel={`${t('travel.title')}: ${region?.name ?? ''}`}
          style={[styles.city, { backgroundColor: c.surface }]}
          testID="open-cities"
        >
          <Text style={{ color: c.text, fontWeight: '800' }} numberOfLines={1}>
            {region ? `${region.flag} ${region.name}` : `🌍 ${t('travel.button')}`}
          </Text>
          <Ionicons name="chevron-down" size={16} color={c.text} />
        </Pressable>
        {onClose && (
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('sidebar.close')}
            hitSlop={8}
            testID="close-sidebar"
          >
            <Ionicons name="chevron-back" size={24} color={c.text} />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} testID="sidebar">
        <Section title={t('sidebar.today')}>
          <DailyChallengeCard places={places} unlocked={unlockedIds} near={position} />
        </Section>

        <Section title={`💎 ${t('hidden.title')}`}>
          <View style={[styles.gem, shadow, { backgroundColor: c.card }]}>
            {/* A foggy mystery: no picture, so nothing gives the gem away. */}
            <LinearGradient
              colors={['#5B7A93', '#9FB6C8', '#DCE6EE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gemArt}
            />
            <View style={[styles.fogBand, { top: 24 }]} />
            <View style={[styles.fogBand, { top: 62, left: 60 }]} />
            <Text style={styles.gemMark} accessible={false}>
              💎?
            </Text>
            <View style={styles.gemBody}>
              <Text style={{ color: c.text, fontWeight: '800' }} testID="gem-hint">
                {hidden.count > 0
                  ? `${t('hidden.count', { count: hidden.count })}. ${t(`hidden.hint.${hidden.hint ?? 'area'}`)}`
                  : t('hidden.none')}
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{t('hidden.rule')}</Text>
            </View>
          </View>
        </Section>

        <Section title={t('sidebar.fromFriends')}>
          {challenges.length === 0 ? (
            <Pressable
              onPress={() => router.push('/friends')}
              accessibilityRole="button"
              style={[styles.empty, { backgroundColor: c.surface }]}
            >
              <Text style={{ color: c.textMuted }}>{t('sidebar.noFriends')}</Text>
              <Text style={{ color: c.accent, fontWeight: '800' }}>
                {t('sidebar.findFriends')} →
              </Text>
            </Pressable>
          ) : (
            challenges.map((x) => (
              <FriendChallengeCard key={x.id} challenge={x} onShow={() => onShowChallenge(x)} />
            ))
          )}
        </Section>

        <Section title={t('sidebar.nearby')}>
          {next.length === 0 && <Text style={{ color: c.textMuted }}>{t('sidebar.allDone')}</Text>}
          {next.map(({ p, d }) => (
            <PlaceCard
              key={p.id}
              place={p}
              distanceM={d}
              unlocked={false}
              onPress={() => onSelect(p)}
            />
          ))}
        </Section>
      </ScrollView>
    </View>
  );
}

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

const styles = StyleSheet.create({
  panel: { flex: 1, borderRightWidth: StyleSheet.hairlineWidth },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  title: { fontSize: 22, fontWeight: '900', flex: 1 },
  city: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    minHeight: 40,
    maxWidth: 170,
  },
  content: { padding: space.lg, paddingTop: space.sm, gap: space.lg, paddingBottom: space.xl * 2 },
  section: { fontSize: 16, fontWeight: '800' },
  gem: { borderRadius: radius.lg, overflow: 'hidden' },
  gemArt: { height: 110 },
  fogBand: {
    position: 'absolute',
    left: -20,
    width: 280,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  gemMark: {
    position: 'absolute',
    top: 26,
    alignSelf: 'center',
    fontSize: 44,
    fontWeight: '900',
    color: '#0B3A5E',
  },
  gemBody: { padding: space.md, gap: 4 },
  empty: { borderRadius: radius.md, padding: space.md, gap: 6 },
});
