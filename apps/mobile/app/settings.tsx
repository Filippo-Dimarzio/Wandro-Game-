import { Ionicons } from '@expo/vector-icons';
import {
  parseSocialHandle,
  SOCIAL_NETWORKS,
  type SocialLinks,
  type SocialNetwork,
} from '@wandro/shared';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameBackdrop } from '@/components/GameBackdrop';
import { LogOutButton } from '@/components/LogOutButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SOCIAL_ICONS } from '@/components/SocialChips';
import { UsernameHint } from '@/components/UsernameHint';
import {
  useDeleteAccount,
  useExportData,
  useUpdateAccount,
  useUsernameStatus,
  useUpdatePrivacy,
} from '@/data/account';
import { t } from '@/i18n';
import { isDemo } from '@/lib/env';
import { setDailyReminder } from '@/lib/notifications';
import { useSession } from '@/state/session';
import { column, radius, space, useColors, useIsDark } from '@/theme';

export default function Settings() {
  const c = useColors();
  const profile = useSession((s) => s.profile);
  const prefs = useSession((s) => s.prefs);
  const setPref = useSession((s) => s.setPref);
  const setTheme = useSession((s) => s.setTheme);
  const dark = useIsDark();
  const privacy = useUpdatePrivacy();
  const exportData = useExportData();
  const deleteAccount = useDeleteAccount();
  const [confirm, setConfirm] = useState('');

  const toggleDaily = async (on: boolean) => {
    setPref('dailyReminder', on);
    const ok = await setDailyReminder(on).catch(() => false);
    if (on && !ok && Platform.OS !== 'web') setPref('dailyReminder', false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <GameBackdrop />
      <ScreenHeader title={t('settings.title')} />
      <ScrollView contentContainerStyle={[styles.container, column]}>
        <Section title={t('settings.privacy')}>
          <Row label={t('settings.private')} hint={t('settings.privateHint')}>
            <Switch
              value={!!profile?.isPrivate}
              onValueChange={(v) => privacy.mutate(v)}
              accessibilityLabel={t('settings.private')}
              testID="private-switch"
            />
          </Row>
        </Section>

        <Section title={t('settings.appearance')}>
          <Row label={t('theme.dark')}>
            <Switch
              value={dark}
              onValueChange={(on) => setTheme(on ? 'dark' : 'light')}
              accessibilityLabel={t('theme.dark')}
              testID="dark-switch"
            />
          </Row>
        </Section>

        <AccountSection />

        <SocialSection />

        <Section title={t('settings.notifications')}>
          <Row
            label={t('settings.daily')}
            hint={Platform.OS === 'web' ? t('settings.dailyWeb') : undefined}
          >
            <Switch
              value={prefs.dailyReminder}
              onValueChange={toggleDaily}
              disabled={Platform.OS === 'web'}
              accessibilityLabel={t('settings.daily')}
            />
          </Row>
        </Section>

        <Section title={t('settings.data')}>
          <Text style={{ color: c.textMuted }}>{t('settings.exportHint')}</Text>
          <Pressable
            onPress={() => exportData.mutate()}
            accessibilityRole="button"
            style={[styles.button, { backgroundColor: c.surface }]}
            testID="export-data"
          >
            <Text style={{ color: c.text, fontWeight: '700' }}>⬇️ {t('settings.export')}</Text>
          </Pressable>
          <Text style={{ color: c.textMuted, marginTop: space.md }}>
            {t('settings.deleteHint')}
          </Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder={t('settings.deleteConfirm')}
            placeholderTextColor={c.textMuted}
            autoCapitalize="characters"
            accessibilityLabel={t('settings.deleteConfirm')}
            style={[styles.input, { color: c.text, borderColor: c.border }]}
            testID="delete-confirm"
          />
          <Pressable
            disabled={confirm !== 'DELETE' || deleteAccount.isPending}
            onPress={() =>
              deleteAccount.mutate(undefined, { onSuccess: () => router.replace('/welcome') })
            }
            accessibilityRole="button"
            accessibilityState={{ disabled: confirm !== 'DELETE' }}
            style={[styles.button, { backgroundColor: confirm === 'DELETE' ? c.danger : c.border }]}
            testID="delete-account"
          >
            <Text style={{ color: confirm === 'DELETE' ? '#fff' : c.textMuted, fontWeight: '800' }}>
              {t('settings.deleteButton')}
            </Text>
          </Pressable>
          {deleteAccount.isError && <Text style={{ color: c.danger }}>{t('common.error')}</Text>}
        </Section>

        <Section title={t('settings.about')}>
          <Pressable
            onPress={() => router.push('/privacy')}
            accessibilityRole="link"
            style={[styles.button, { backgroundColor: c.surface }]}
          >
            <Text style={{ color: c.text, fontWeight: '700' }}>{t('settings.privacyPolicy')}</Text>
          </Pressable>
          <Text style={{ color: c.textMuted }}>
            {t('settings.version', { version: Constants.expoConfig?.version ?? '' })}
          </Text>
        </Section>

        <LogOutButton />
      </ScrollView>
    </SafeAreaView>
  );
}

/** Login, username and password, right under Dark mode. */
function AccountSection() {
  const c = useColors();
  const account = useSession((s) => s.account);
  const current = useSession((s) => s.profile?.username ?? '');
  const update = useUpdateAccount();
  const [username, setUsername] = useState(current);
  const [saved, setSaved] = useState(false);
  const changed = username !== current;
  const status = useUsernameStatus(username, current);
  const valid = status === 'available';
  // A demo explorer without a login has no password to change yet.
  const hasPassword = !isDemo || !!account;
  const error = update.error?.message;

  return (
    <Section title={t('settings.account')}>
      {isDemo && account && (
        <Text style={{ color: c.textMuted }} testID="logged-in-as">
          {t('settings.loggedInAs', { email: account.email })}
        </Text>
      )}
      <Text style={{ color: c.text, fontWeight: '600' }}>{t('settings.username')}</Text>
      <TextInput
        value={username}
        onChangeText={(v) => {
          setUsername(v);
          setSaved(false);
          update.reset();
        }}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        maxLength={24}
        accessibilityLabel={t('settings.username')}
        style={[styles.input, { color: c.text, borderColor: c.border }]}
        testID="settings-username"
      />
      <UsernameHint status={error === 'username_taken' ? 'taken' : changed ? status : 'idle'} />
      <Pressable
        onPress={() => update.mutate({ username }, { onSuccess: () => setSaved(true) })}
        disabled={!changed || !valid || update.isPending}
        accessibilityRole="button"
        accessibilityState={{ disabled: !changed || !valid }}
        style={[styles.button, { backgroundColor: changed && valid ? c.accent : c.surface }]}
        testID="save-username"
      >
        <Text style={{ color: changed && valid ? c.accentOn : c.textMuted, fontWeight: '800' }}>
          {saved && !changed ? t('settings.saved') : t('settings.usernameSave')}
        </Text>
      </Pressable>

      <Text style={{ color: c.text, fontWeight: '600', marginTop: space.sm }}>
        {t('settings.password')}
      </Text>
      {hasPassword ? (
        <Pressable
          onPress={() => router.push('/change-password')}
          accessibilityRole="button"
          style={[styles.button, { backgroundColor: c.surface }]}
          testID="change-password"
        >
          <Text style={{ color: c.text, fontWeight: '700' }}>
            🔑 {t('settings.changePassword')}
          </Text>
        </Pressable>
      ) : (
        <>
          <Text style={{ color: c.textMuted }}>{t('settings.addLoginHint')}</Text>
          <Pressable
            onPress={() => router.push('/add-login')}
            accessibilityRole="button"
            style={[styles.button, { backgroundColor: c.accent }]}
            testID="add-login"
          >
            <Text style={{ color: c.accentOn, fontWeight: '800' }}>{t('settings.addLogin')}</Text>
          </Pressable>
        </>
      )}
    </Section>
  );
}

/** Instagram, Facebook, X and TripBFF handles, shown next to the city on the profile. */
function SocialSection() {
  const c = useColors();
  const stored = useSession((s) => s.profile?.socials);
  const update = useUpdateAccount();
  const [draft, setDraft] = useState<Record<SocialNetwork, string>>(
    () =>
      Object.fromEntries(
        SOCIAL_NETWORKS.map((n) => [n, stored?.[n] ? `@${stored[n]}` : '']),
      ) as Record<SocialNetwork, string>,
  );
  const [saved, setSaved] = useState(false);
  const parsed = SOCIAL_NETWORKS.map((n) => [n, parseSocialHandle(n, draft[n])] as const);
  const invalid = parsed.filter(([, h]) => h === null).map(([n]) => n);

  const save = () => {
    const socials: SocialLinks = {};
    for (const [n, h] of parsed) if (h) socials[n] = h;
    update.mutate({ socials }, { onSuccess: () => setSaved(true) });
  };

  return (
    <Section title={t('settings.socials')}>
      <Text style={{ color: c.textMuted }}>{t('settings.socialsHint')}</Text>
      {SOCIAL_NETWORKS.map((n) => (
        <View key={n} style={styles.social}>
          <Ionicons name={SOCIAL_ICONS[n]} size={22} color={c.text} />
          <TextInput
            value={draft[n]}
            onChangeText={(v) => {
              setDraft((d) => ({ ...d, [n]: v }));
              setSaved(false);
            }}
            placeholder={`${t(`social.${n}`)}: ${t('social.placeholder')}`}
            placeholderTextColor={c.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            accessibilityLabel={t(`social.${n}`)}
            style={[
              styles.input,
              { flex: 1, color: c.text, borderColor: invalid.includes(n) ? c.danger : c.border },
            ]}
            testID={`social-${n}`}
          />
        </View>
      ))}
      {invalid.map((n) => (
        <Text key={n} style={{ color: c.danger, fontSize: 13 }}>
          {t('social.invalid', { network: t(`social.${n}`) })}
        </Text>
      ))}
      {update.isError && <Text style={{ color: c.danger }}>{t('common.error')}</Text>}
      <Pressable
        onPress={save}
        disabled={invalid.length > 0 || update.isPending}
        accessibilityRole="button"
        accessibilityState={{ disabled: invalid.length > 0 }}
        style={[styles.button, { backgroundColor: invalid.length ? c.surface : c.accent }]}
        testID="save-socials"
      >
        <Text style={{ color: invalid.length ? c.textMuted : c.accentOn, fontWeight: '800' }}>
          {saved ? t('settings.saved') : t('settings.socialsSave')}
        </Text>
      </Pressable>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={[styles.section, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const c = useColors();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: c.text, fontWeight: '600' }}>{label}</Text>
        {hint && <Text style={{ color: c.textMuted, fontSize: 13 }}>{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg },
  section: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    gap: space.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44 },
  social: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  button: {
    borderRadius: radius.pill,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 46,
    paddingHorizontal: space.md,
    fontSize: 16,
  },
});
