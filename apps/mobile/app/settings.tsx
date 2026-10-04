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
import { LogOutButton } from '@/components/LogOutButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useDeleteAccount, useExportData, useUpdatePrivacy } from '@/data/account';
import { t } from '@/i18n';
import { isDemo } from '@/lib/env';
import { setDailyReminder } from '@/lib/notifications';
import { useSession } from '@/state/session';
import { column, radius, space, useColors } from '@/theme';

export default function Settings() {
  const c = useColors();
  const profile = useSession((s) => s.profile);
  const prefs = useSession((s) => s.prefs);
  const setPref = useSession((s) => s.setPref);
  const demoModerator = useSession((s) => s.demoModerator);
  const setDemoModerator = useSession((s) => s.setDemoModerator);
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

        {isDemo && (
          <Section title={t('settings.demo')}>
            <Row label={t('settings.demoModerator')}>
              <Switch
                value={demoModerator}
                onValueChange={setDemoModerator}
                accessibilityLabel={t('settings.demoModerator')}
              />
            </Row>
          </Section>
        )}

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
