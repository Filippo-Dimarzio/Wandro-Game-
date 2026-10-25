import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CredentialsForm } from '@/components/CredentialsForm';
import { GameBackdrop } from '@/components/GameBackdrop';
import { WandroLogo } from '@/components/WandroLogo';
import { loadServerProfile } from '@/data/account';
import { t } from '@/i18n';
import { appLink, isEmailSendFailure, signInWithProvider, useOAuthProviders } from '@/lib/auth';
import { isDemo } from '@/lib/env';
import { looksLikeEmail, normaliseEmail, verifyPassword } from '@/lib/password';
import { offerToSavePassword } from '@/lib/passwordManager';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';
import { column, radius, space, useColors } from '@/theme';

type Message = { tone: 'error' | 'info'; text: string };

/** Log in with email and password (or Google / Apple once the server is connected). */
export default function Login() {
  const c = useColors();
  const account = useSession((s) => s.account);
  const username = useSession((s) => s.profile?.username);
  const signIn = useSession((s) => s.signIn);
  const completeOnboarding = useSession((s) => s.completeOnboarding);
  const demoRetired = useSession((s) => s.demoRetired);
  const providers = useOAuthProviders();
  const [email, setEmail] = useState(account?.email ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const logIn = async () => {
    setBusy(true);
    setMessage(null);
    try {
      if (isDemo) {
        if (!account || normaliseEmail(email) !== account.email)
          return setMessage({ tone: 'error', text: t('login.demoNoAccount') });
        if (!(await verifyPassword(password, account)))
          return setMessage({ tone: 'error', text: t('login.wrong') });
        await offerToSavePassword({ email: account.email, password, name: username });
        signIn();
        return router.replace('/(tabs)');
      }
      const db = supabase!;
      const { data, error } = await db.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        const code = (error as { code?: string }).code;
        const text =
          code === 'invalid_credentials'
            ? t('login.wrong')
            : code === 'email_not_confirmed'
              ? t('register.checkEmail')
              : error.message;
        return setMessage({ tone: 'error', text });
      }
      await offerToSavePassword({ email: email.trim(), password });
      const profile = await loadServerProfile(data.user.id);
      if (!profile) return router.replace('/register');
      completeOnboarding(profile);
      router.replace('/(tabs)');
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (isDemo) return setMessage({ tone: 'info', text: t('login.demoForgot') });
    if (!looksLikeEmail(email))
      return setMessage({ tone: 'error', text: t('login.forgotNeedsEmail') });
    setBusy(true);
    const { error } = await supabase!.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: appLink('/reset-password'),
    });
    setBusy(false);
    if (error && isEmailSendFailure(error))
      return setMessage({ tone: 'error', text: t('login.emailFailed') });
    // Same screen whether or not the email has an account, so it can't be used to probe.
    router.push({ pathname: '/check-email', params: { email: email.trim(), kind: 'reset' } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <GameBackdrop />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.container, column]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <WandroLogo size={56} />
            <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
              {t('login.title')}
            </Text>
            <Text style={{ color: c.textMuted, textAlign: 'center' }}>{t('login.subtitle')}</Text>
          </View>

          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            {isDemo && (
              <Text style={{ color: c.textMuted, fontSize: 13 }}>{t('login.demoNote')}</Text>
            )}
            {!isDemo && demoRetired && (
              <Text style={{ color: c.text, fontWeight: '600' }} testID="went-live-note">
                {t('login.wentLive')}
              </Text>
            )}
            <CredentialsForm
              mode="login"
              email={email}
              onEmailChange={setEmail}
              password={password}
              onPasswordChange={setPassword}
              submitLabel={t('login.submit')}
              canSubmit={looksLikeEmail(email) && password.length > 0}
              busy={busy}
              onSubmit={logIn}
            >
              {message && (
                <Text
                  style={{ color: message.tone === 'error' ? c.danger : c.text, fontWeight: '600' }}
                  accessibilityLiveRegion="polite"
                  testID="login-message"
                >
                  {message.text}
                </Text>
              )}
              <Pressable
                onPress={forgot}
                accessibilityRole="button"
                style={styles.link}
                testID="forgot-password"
              >
                <Text style={{ color: c.accent, fontWeight: '700' }}>{t('login.forgot')}</Text>
              </Pressable>
            </CredentialsForm>
          </View>

          {providers.length > 0 && (
            <View style={{ gap: space.sm }}>
              <Text style={{ color: c.textMuted, textAlign: 'center' }}>{t('login.or')}</Text>
              {providers.includes('apple') && (
                <Pressable
                  style={[styles.oauth, { backgroundColor: c.text }]}
                  onPress={() =>
                    signInWithProvider('apple').catch((e) =>
                      setMessage({ tone: 'error', text: String(e.message ?? e) }),
                    )
                  }
                  accessibilityRole="button"
                >
                  <Ionicons name="logo-apple" size={18} color={c.bg} />
                  <Text style={{ color: c.bg, fontWeight: '700' }}>{t('register.apple')}</Text>
                </Pressable>
              )}
              {providers.includes('google') && (
                <Pressable
                  style={[styles.oauth, { borderColor: c.border, borderWidth: 1 }]}
                  onPress={() =>
                    signInWithProvider('google').catch((e) =>
                      setMessage({ tone: 'error', text: String(e.message ?? e) }),
                    )
                  }
                  accessibilityRole="button"
                >
                  <Ionicons name="logo-google" size={18} color={c.text} />
                  <Text style={{ color: c.text, fontWeight: '700' }}>{t('register.google')}</Text>
                </Pressable>
              )}
            </View>
          )}

          <View style={styles.footer}>
            <Text style={{ color: c.textMuted }}>{t('login.newHere')}</Text>
            <Pressable
              onPress={() => router.replace('/register')}
              accessibilityRole="link"
              hitSlop={8}
              testID="go-register"
            >
              <Text style={{ color: c.accent, fontWeight: '800' }}>{t('login.create')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.xl, gap: space.lg, paddingTop: space.xl * 2 },
  brand: { alignItems: 'center', gap: space.sm },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'center' },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    gap: space.md,
  },
  link: { alignItems: 'center', padding: space.sm },
  oauth: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    minHeight: 50,
  },
  footer: {
    flexDirection: 'row',
    gap: space.xs,
    justifyContent: 'center',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
});
