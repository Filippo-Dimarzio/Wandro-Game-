import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthForm, useSubmitAuthForm } from '@/components/AuthForm';
import { PasswordField } from '@/components/CredentialsForm';
import { GameBackdrop } from '@/components/GameBackdrop';
import { ScreenHeader } from '@/components/ScreenHeader';
import { t } from '@/i18n';
import { isDemo } from '@/lib/env';
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from '@/lib/password';
import { offerToSavePassword } from '@/lib/passwordManager';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';
import { column, radius, space, useColors } from '@/theme';

/** Change your password: confirm the current one, then pick a new one. */
export default function ChangePassword() {
  const c = useColors();
  const account = useSession((s) => s.account);
  const setAccount = useSession((s) => s.setAccount);
  const username = useSession((s) => s.profile?.username);
  const [email, setEmail] = useState(account?.email ?? '');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!isDemo) supabase?.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''));
  }, []);

  const canSubmit = current.length > 0 && next.length >= MIN_PASSWORD_LENGTH && !busy;

  const save = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setMessage(null);
    try {
      if (isDemo) {
        if (!account || !(await verifyPassword(current, account)))
          return setMessage({ ok: false, text: t('password.wrongCurrent') });
        setAccount({ email: account.email, ...(await hashPassword(next)) });
      } else {
        const db = supabase!;
        // Re-check the current password before changing it.
        const check = await db.auth.signInWithPassword({ email, password: current });
        if (check.error) return setMessage({ ok: false, text: t('password.wrongCurrent') });
        const { error } = await db.auth.updateUser({ password: next });
        if (error) return setMessage({ ok: false, text: error.message });
      }
      await offerToSavePassword({ email, password: next, name: username });
      setCurrent('');
      setNext('');
      setMessage({ ok: true, text: t('password.changed') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <GameBackdrop />
      <ScreenHeader title={t('password.title')} />
      <ScrollView
        contentContainerStyle={[styles.container, column]}
        keyboardShouldPersistTaps="handled"
      >
        <AuthForm onSubmit={save}>
          <Fields
            email={email}
            current={current}
            setCurrent={setCurrent}
            next={next}
            setNext={setNext}
            canSubmit={canSubmit}
            busy={busy}
          />
        </AuthForm>
        {message && (
          <Text
            style={{ color: message.ok ? c.text : c.danger, fontWeight: '600' }}
            accessibilityLiveRegion="polite"
            testID="password-message"
          >
            {message.text}
          </Text>
        )}
        {message?.ok && (
          <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.link}>
            <Text style={{ color: c.accent, fontWeight: '800' }}>{t('common.done')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Fields(props: {
  email: string;
  current: string;
  setCurrent: (v: string) => void;
  next: string;
  setNext: (v: string) => void;
  canSubmit: boolean;
  busy: boolean;
}) {
  const c = useColors();
  const submit = useSubmitAuthForm();
  return (
    <>
      {/* Password managers match the change to the saved login by this username field. */}
      <TextInput
        value={props.email}
        editable={false}
        autoComplete="username"
        textContentType="username"
        accessibilityLabel={t('register.email')}
        style={[styles.input, { color: c.textMuted, borderColor: c.border }]}
        testID="email"
      />
      <View style={{ gap: 6 }}>
        <Text style={{ color: c.text, fontWeight: '700' }}>{t('password.current')}</Text>
        <PasswordField
          value={props.current}
          onChangeText={props.setCurrent}
          kind="current"
          label={t('password.current')}
          testID="current-password"
        />
      </View>
      <View style={{ gap: 6 }}>
        <Text style={{ color: c.text, fontWeight: '700' }}>{t('password.new')}</Text>
        <PasswordField
          value={props.next}
          onChangeText={props.setNext}
          kind="new"
          onSubmitEditing={submit}
          label={t('password.new')}
          testID="new-password"
        />
        <Text style={{ color: c.textMuted, fontSize: 13 }}>{t('login.passwordHint')}</Text>
      </View>
      <Pressable
        onPress={submit}
        disabled={!props.canSubmit}
        accessibilityRole="button"
        accessibilityState={{ disabled: !props.canSubmit, busy: props.busy }}
        style={[styles.primary, { backgroundColor: props.canSubmit ? c.accent : c.border }]}
        testID="save-password"
      >
        <Text
          style={{
            color: props.canSubmit ? c.accentOn : c.textMuted,
            fontWeight: '800',
            fontSize: 16,
          }}
        >
          {props.busy ? t('login.busy') : t('password.save')}
        </Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    minHeight: 50,
    fontSize: 16,
  },
  primary: {
    borderRadius: radius.pill,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { alignItems: 'center', padding: space.sm },
});
