import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { explorerStage } from '@wandro/shared';
import { Ionicons } from '@expo/vector-icons';
import { GameBackdrop } from '@/components/GameBackdrop';
import { ExplorerAvatar } from '@/components/ExplorerAvatar';
import { useMyExplorer } from '@/data/explorer';
import { useBadges } from '@/data/badges';
import { useLoadout } from '@/data/loadout';
import { useIsModerator } from '@/data/moderation';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { useWallet } from '@/data/wallet';
import { InstallBanner } from '@/components/InstallBanner';
import { LogOutButton } from '@/components/LogOutButton';
import { ProgressStrip } from '@/components/ProgressStrip';
import { classTitle, Records, StyleBars, TrophyShelf } from '@/components/ProfileSections';
import { useExplorerStats } from '@/data/explorerStats';
import { isDemo } from '@/lib/env';
import { homeCityLabel } from '@/lib/homeCity';
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
  const stats = useExplorerStats();
  const isModerator = useIsModerator();
  const loadout = useLoadout();
  const profile = useSession((s) => s.profile);
  const level = wallet.level;
  const explorer = useMyExplorer();
  const city = homeCityLabel(profile?.homeCity);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <GameBackdrop />
      <ScrollView contentContainerStyle={[styles.container, column]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.push('/customise')}
            accessibilityRole="button"
            accessibilityLabel={t('customise.title')}
          >
            <ExplorerAvatar
              explorer={explorer}
              level={level}
              size={76}
              skin={loadout.skin}
              hat={loadout.hat}
              glow={loadout.trailActive}
              accessibilityLabel={t('profile.stage', { stage: explorerStage(level) })}
            />
            <View style={[styles.edit, { backgroundColor: c.accent, borderColor: c.bg }]}>
              <Ionicons name="color-palette" size={14} color={c.accentOn} />
            </View>
          </Pressable>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.name, { color: c.text }]} accessibilityRole="header">
              {profile?.username}
            </Text>
            <Text style={{ color: c.accent, fontWeight: '800' }} testID="explorer-class">
              {t('profile.classLine', { class: classTitle(stats), level })}
            </Text>
            <View style={styles.chips}>
              {city && (
                <View style={[styles.link, { backgroundColor: c.surface }]} testID="home-city">
                  <Text style={{ fontSize: 16 }}>{city.flag}</Text>
                  <Text style={{ color: c.text, fontWeight: '700' }}>{city.name}</Text>
                </View>
              )}
              <LinkButton
                icon="color-palette"
                label={t('profile.customise')}
                onPress={() => router.push('/customise')}
                testID="customise-button"
              />
            </View>
          </View>
        </View>

        <Text style={[styles.section, { color: c.text }]}>{t('profile.progress')}</Text>
        <ProgressStrip wallet={wallet} />

        <Text style={[styles.section, { color: c.text }]}>{t('profile.records')}</Text>
        <Records stats={stats} streak={wallet.streak} />

        <Text style={[styles.section, { color: c.text }]}>{t('profile.style')}</Text>
        <StyleBars stats={stats} />

        <View style={styles.links}>
          <LinkButton
            icon="book"
            label={t('passport.title')}
            onPress={() => router.push('/passport')}
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
          {isDemo && (
            <LinkButton
              icon="rocket"
              label={t('joinCard.cta')}
              onPress={() => router.push('/join?src=profile')}
            />
          )}
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

        <Text style={[styles.section, { color: c.text }]}>{t('profile.trophies')}</Text>
        <TrophyShelf badges={allBadges} />

        <InstallBanner always />
        <LogOutButton />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xs },
  edit: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.link, { backgroundColor: c.surface }]}
      testID={testID}
    >
      <Ionicons name={icon} size={18} color={c.accent} />
      <Text style={{ color: c.text, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
