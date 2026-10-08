import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { explorerStage } from '@wandro/shared';
import { Ionicons } from '@expo/vector-icons';
import { GameBackdrop } from '@/components/GameBackdrop';
import { ExplorerAvatar } from '@/components/ExplorerAvatar';
import { ExplorerPicker } from '@/components/ExplorerPicker';
import { useMyExplorer, useSetExplorer } from '@/data/explorer';
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
  const setExplorer = useSetExplorer();
  const [picking, setPicking] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <GameBackdrop />
      <ScrollView contentContainerStyle={[styles.container, column]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.push('/shop')}
            accessibilityRole="button"
            accessibilityLabel={t('profile.store')}
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
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: c.text }]} accessibilityRole="header">
              {profile?.username}
            </Text>
            {profile?.homeCity ? (
              <Text style={{ color: c.textMuted }}>{profile.homeCity}</Text>
            ) : null}
            <Text style={{ color: c.accent, fontWeight: '800' }} testID="explorer-class">
              {t('profile.classLine', { class: classTitle(stats), level })}
            </Text>
            <Text style={{ color: c.textMuted, fontWeight: '600' }}>
              {t('profile.stage', { stage: explorerStage(level) })}
            </Text>
            <Pressable
              onPress={() => setPicking((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: picking }}
              testID="change-explorer"
            >
              <Text style={{ color: c.textMuted, fontWeight: '700', marginTop: 4 }}>
                {t('profile.changeExplorer')}
              </Text>
            </Pressable>
          </View>
        </View>

        {picking && (
          <View style={[styles.picker, { backgroundColor: c.surface }]}>
            <ExplorerPicker
              value={explorer}
              skin={loadout.skin}
              onChange={(id) => setExplorer.mutate(id, { onSuccess: () => setPicking(false) })}
            />
          </View>
        )}

        <Text style={[styles.section, { color: c.text }]}>{t('profile.progress')}</Text>
        <ProgressStrip wallet={wallet} />

        <Text style={[styles.section, { color: c.text }]}>{t('profile.records')}</Text>
        <Records stats={stats} streak={wallet.streak} />

        <Text style={[styles.section, { color: c.text }]}>{t('profile.style')}</Text>
        <StyleBars stats={stats} />

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
          <LinkButton
            icon="help-circle"
            label={t('howto.title')}
            onPress={() => router.push('/howto')}
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
  picker: { borderRadius: radius.lg, padding: space.md },
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
