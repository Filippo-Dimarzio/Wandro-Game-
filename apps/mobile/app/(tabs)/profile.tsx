import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { octopusStage } from '@wandro/shared';
import { Ionicons } from '@expo/vector-icons';
import { OctopusAvatar } from '@/components/OctopusAvatar';
import { useBadges } from '@/data/badges';
import { useLoadout } from '@/data/loadout';
import { useIsModerator } from '@/data/moderation';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { useWallet } from '@/data/wallet';
import { LogOutButton } from '@/components/LogOutButton';
import { t } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { PlaceMap } from '@/map/PlaceMap';
import { useSession } from '@/state/session';
import { column, radius, space, useColors } from '@/theme';

export default function Profile() {
  const c = useColors();
  const loc = useLocation();
  const places = usePlaces(loc.position).data ?? [];
  const { ids } = useUnlockedIds();
  const wallet = useWallet();
  const allBadges = useBadges();
  const isModerator = useIsModerator();
  const loadout = useLoadout();
  const profile = useSession((s) => s.profile);
  const level = wallet.level;
  const discovered = places.filter((p) => ids.has(p.id));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.container, column]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.push('/shop')}
            accessibilityRole="button"
            accessibilityLabel={t('profile.store')}
          >
            <OctopusAvatar
              size={76}
              skin={loadout.skin}
              hat={loadout.hat}
              glow={loadout.trailActive}
              accessibilityLabel={t('profile.stage', { stage: octopusStage(level) })}
            />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: c.text }]} accessibilityRole="header">
              {profile?.username}
            </Text>
            {profile?.homeCity ? (
              <Text style={{ color: c.textMuted }}>{profile.homeCity}</Text>
            ) : null}
            <Text style={{ color: c.accent, fontWeight: '700' }}>
              {t('profile.stage', { stage: octopusStage(level) })}
            </Text>
          </View>
        </View>

        <View style={styles.links}>
          <LinkButton
            icon="search"
            label={t('search.title')}
            onPress={() => router.push('/search')}
          />
          <LinkButton
            icon="book"
            label={t('passport.title')}
            onPress={() => router.push('/passport')}
          />
          <LinkButton
            icon="trophy"
            label={t('leaderboard.title')}
            onPress={() => router.push('/leaderboard')}
          />
          <LinkButton
            icon="storefront"
            label={t('profile.store')}
            onPress={() => router.push('/shop')}
          />
          <LinkButton
            icon="settings"
            label={t('profile.settings')}
            onPress={() => router.push('/settings')}
          />
          {isModerator && (
            <LinkButton
              icon="shield-checkmark"
              label={t('mod.title')}
              onPress={() => router.push('/moderation')}
            />
          )}
        </View>

        <Text style={[styles.section, { color: c.text }]}>{t('profile.mapOfYou')}</Text>
        <View style={[styles.map, { borderColor: c.border }]}>
          <PlaceMap places={places} unlockedIds={ids} userPosition={loc.position} compact />
        </View>

        <View style={styles.stats}>
          {[
            [t('profile.discoveries'), discovered.length],
            [t('profile.points'), wallet.coins],
            [t('profile.level'), level],
          ].map(([label, value]) => (
            <View
              key={String(label)}
              style={[styles.stat, { backgroundColor: c.surface }]}
              accessible
              accessibilityLabel={`${label}: ${value}`}
            >
              <Text style={{ color: c.text, fontSize: 22, fontWeight: '900' }}>{value}</Text>
              <Text style={{ color: c.textMuted }}>{label}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.section, { color: c.text }]}>{t('profile.badges')}</Text>
        <View style={styles.badges}>
          {allBadges.map((b) => (
            <View
              key={b.code}
              style={[styles.badge, { backgroundColor: c.surface, opacity: b.awardedAt ? 1 : 0.4 }]}
              accessible
              accessibilityLabel={`${b.name}: ${b.description}${b.awardedAt ? '' : ', locked'}`}
            >
              <Text style={{ fontSize: 26 }}>{b.emoji}</Text>
              <Text style={{ color: c.text, fontWeight: '600', textAlign: 'center', fontSize: 12 }}>
                {b.name}
              </Text>
            </View>
          ))}
        </View>

        <LogOutButton />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    minHeight: 40,
  },
  container: { padding: space.lg, gap: space.md },
  header: { flexDirection: 'row', gap: space.lg, alignItems: 'center', paddingTop: space.lg },
  name: { fontSize: 24, fontWeight: '900' },
  section: { fontSize: 18, fontWeight: '800', marginTop: space.sm },
  map: {
    height: 220,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, borderRadius: radius.md, padding: space.md, alignItems: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  badge: {
    width: '23%',
    minWidth: 76,
    borderRadius: radius.md,
    padding: space.sm,
    alignItems: 'center',
    gap: 4,
  },
  button: {
    borderWidth: 1,
    borderRadius: radius.pill,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.lg,
  },
});

function LinkButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.link, { backgroundColor: c.surface }]}
    >
      <Ionicons name={icon} size={18} color={c.accent} />
      <Text style={{ color: c.text, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
