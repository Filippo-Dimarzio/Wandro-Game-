import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CredentialsForm } from '@/components/CredentialsForm';
import { GameBackdrop } from '@/components/GameBackdrop';
import { ScreenHeader } from '@/components/ScreenHeader';
import { loadServerProfile } from '@/data/account';
import { t } from '@/i18n';
import { MIN_PASSWORD_LENGTH } from '@/lib/password';
import { offerToSavePassword } from '@/lib/passwordManager';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';
import { column, space, useColors } from '@/theme';

/** Where the "reset your password" email lands: pick a new password, then carry on. */
export default function ResetPassword() {
  const c = useColors();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const completeOnboarding = useSession((s) => s.completeOnboarding);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = supabase;
    if (!db) return setError(t('login.resetExpired'));
    (async () => {
      // On the web Supabase reads the link itself; the apps get a one-time code to swap.
      if (code && Platform.OS !== 'web') await db.auth.exchangeCodeForSession(code);
      const { data } = await db.auth.getSession();
      if (!data.session) return setError(t('login.resetExpired'));
      setEmail(data.session.user.email ?? '');
      setReady(true);
    })();
  }, [code]);

  const save = async () => {
    const db = supabase!;
    setBusy(true);
    const { data, error: e } = await db.auth.updateUser({ password });
    if (e || !data.user) {
      setBusy(false);
      return setError(e?.message ?? t('common.error'));
    }
    await offerToSavePassword({ email, password });
    const profile = await loadServerProfile(data.user.id);
    setBusy(false);
    if (!profile) return router.replace('/register');
    completeOnboarding(profile);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <GameBackdrop />
      <ScreenHeader title={t('login.resetTitle')} />
      <ScrollView
        contentContainerStyle={[styles.container, column]}
        keyboardShouldPersistTaps="handled"
      >
        {ready && (
          <CredentialsForm
            mode="create"
            email={email}
            onEmailChange={setEmail}
            password={password}
            onPasswordChange={setPassword}
            submitLabel={t('login.resetSubmit')}
            canSubmit={password.length >= MIN_PASSWORD_LENGTH}
            busy={busy}
            onSubmit={save}
          />
        )}
        {error && (
          <Text style={{ color: c.danger }} accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg },
});
