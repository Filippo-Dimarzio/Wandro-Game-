import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_EXPLORER, type Category, type ExplorerId } from '@wandro/shared';
import { GameBackdrop } from '@/components/GameBackdrop';
import { CategoryMark } from '@/components/CategoryMark';
import { Check } from '@/components/Check';
import { CredentialsForm } from '@/components/CredentialsForm';
import { ExplorerPicker } from '@/components/ExplorerPicker';
import { loadServerProfile, USERNAME_RULE } from '@/data/account';
import { t, type TranslationKey } from '@/i18n';
import { signInWithProvider, useAuthSession } from '@/lib/auth';
import { confirmAction } from '@/lib/confirm';
import { isDemo } from '@/lib/env';
import {
  canHashPasswords,
  hashPassword,
  looksLikeEmail,
  MIN_PASSWORD_LENGTH,
  normaliseEmail,
} from '@/lib/password';
import { offerToSavePassword } from '@/lib/passwordManager';
import { supabase } from '@/lib/supabase';
import { useSession, type DemoAccount } from '@/state/session';
import { radius, space, useColors } from '@/theme';

// Each explorer style wears the colour of the category it maps to.
const STYLES: { id: string; category: Category }[] = [
  { id: 'beaches', category: 'coast' },
  { id: 'nature', category: 'nature' },
  { id: 'castles', category: 'heritage' },
  { id: 'museums', category: 'art' },
  { id: 'culture', category: 'culture' },
  { id: 'music', category: 'music_events' },
  { id: 'hidden', category: 'other' },
];

const USERNAME = USERNAME_RULE;

export default function Register() {
  const c = useColors();
  const { session } = useAuthSession();
  const completeOnboarding = useSession((s) => s.completeOnboarding);
  const existing = useSession((s) => (s.onboarded ? (s.profile?.username ?? '') : null));
  const deviceAccount = useSession((s) => s.account);
  const resetDevice = useSession((s) => s.reset);
  // A native demo build without WebCrypto can't check passwords, so it skips the login step.
  const withAccount = !isDemo || canHashPasswords();
  const [step, setStep] = useState<'account' | 'profile' | 'style'>(
    withAccount ? 'account' : 'profile',
  );
  /** Demo login to save with the profile at the end. */
  const [pending, setPending] = useState<DemoAccount | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [explorer, setExplorer] = useState<ExplorerId>(DEFAULT_EXPLORER);
  const [styles_, setStyles] = useState<string[]>([]);
  const [guidelines, setGuidelines] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const currentStep = step === 'account' && session ? 'profile' : step;

  // Someone who already has a server profile (e.g. back from Google / Apple) goes straight in.
  useEffect(() => {
    if (!session) return;
    loadServerProfile(session.user.id).then((p) => {
      if (!p) return;
      completeOnboarding(p);
      router.replace('/(tabs)');
    });
  }, [session, completeOnboarding]);

  const createAccount = async () => {
    setBusy(true);
    setMessage(null);
    try {
      if (isDemo) {
        const login = normaliseEmail(email);
        if (deviceAccount?.email === login) return setMessage(t('login.exists'));
        if (existing !== null || deviceAccount) {
          const ok = await confirmAction(
            t('login.replaceTitle'),
            t('login.replaceBody', { username: existing ?? '' }),
            t('login.replaceConfirm'),
            t('common.cancel'),
          );
          if (!ok) return;
          resetDevice();
        }
        setPending({ email: login, ...(await hashPassword(password)) });
        await offerToSavePassword({ email: login, password });
        return setStep('profile');
      }
      const res = await supabase!.auth.signUp({ email: email.trim(), password });
      if (res.error) return setMessage(res.error.message);
      await offerToSavePassword({ email: email.trim(), password });
      if (!res.data.session) return setMessage(t('register.checkEmail'));
      setStep('profile');
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    setMessage(null);
    if (supabase && session) {
      const { error } = await supabase
        .from('profiles')
        .update({ username, home_city: homeCity || null, explorer_styles: styles_, explorer })
        .eq('id', session.user.id);
      if (error) {
        setBusy(false);
        return setMessage(error.message);
      }
    }
    completeOnboarding(
      { username, homeCity, explorerStyles: styles_, explorer },
      pending ?? undefined,
    );
    setBusy(false);
    router.replace('/(tabs)');
  };

  const input = [styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <GameBackdrop />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
            {t('register.title')}
          </Text>
          <StepDots step={currentStep} withAccount={withAccount} />

          {currentStep === 'account' && (
            <View style={styles.section}>
              {isDemo ? (
                <Text style={{ color: c.textMuted }}>{t('login.demoNote')}</Text>
              ) : (
                <>
                  <Pressable
                    style={[styles.oauth, { backgroundColor: c.text }]}
                    onPress={() =>
                      signInWithProvider('apple').catch((e) => setMessage(String(e.message ?? e)))
                    }
                    accessibilityRole="button"
                  >
                    <Ionicons name="logo-apple" size={18} color={c.bg} />
                    <Text style={{ color: c.bg, fontWeight: '700' }}>{t('register.apple')}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.oauth, { borderColor: c.border, borderWidth: 1 }]}
                    onPress={() =>
                      signInWithProvider('google').catch((e) => setMessage(String(e.message ?? e)))
                    }
                    accessibilityRole="button"
                  >
                    <Ionicons name="logo-google" size={18} color={c.text} />
                    <Text style={{ color: c.text, fontWeight: '700' }}>{t('register.google')}</Text>
                  </Pressable>
                  <Text style={{ color: c.textMuted, textAlign: 'center' }}>{t('login.or')}</Text>
                </>
              )}
              <CredentialsForm
                mode="create"
                email={email}
                onEmailChange={setEmail}
                password={password}
                onPasswordChange={setPassword}
                submitLabel={t('register.signUp')}
                canSubmit={looksLikeEmail(email) && password.length >= MIN_PASSWORD_LENGTH}
                busy={busy}
                onSubmit={createAccount}
              />
              <View style={styles.footer}>
                <Text style={{ color: c.textMuted }}>{t('login.haveAccount')}</Text>
                <Pressable
                  onPress={() => router.replace('/login')}
                  accessibilityRole="link"
                  hitSlop={8}
                  testID="go-login"
                >
                  <Text style={{ color: c.accent, fontWeight: '800' }}>{t('login.submit')}</Text>
                </Pressable>
              </View>
            </View>
          )}

          {currentStep === 'profile' && (
            <View style={styles.section}>
              {isDemo && !withAccount && (
                <Text style={{ color: c.textMuted }}>{t('register.demoNote')}</Text>
              )}
              <Text style={[styles.label, { color: c.text }]}>{t('register.username')}</Text>
              <TextInput
                style={input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={t('register.username')}
                testID="username"
              />
              <Text
                style={{
                  color: username && !USERNAME.test(username) ? c.danger : c.textMuted,
                  fontSize: 13,
                }}
              >
                {t('register.usernameHint')}
              </Text>
              <Text style={[styles.label, { color: c.text }]}>{t('register.homeCity')}</Text>
              <TextInput
                style={input}
                value={homeCity}
                onChangeText={setHomeCity}
                accessibilityLabel={t('register.homeCity')}
                placeholder="Sintra"
                placeholderTextColor={c.textMuted}
              />
              <Text style={[styles.label, { color: c.text }]}>{t('register.explorerTitle')}</Text>
              <Text style={{ color: c.textMuted, fontSize: 13 }}>{t('register.explorerHint')}</Text>
              <ExplorerPicker value={explorer} onChange={setExplorer} size={56} />
              <Primary
                label={t('register.next')}
                onPress={() => setStep('style')}
                disabled={!USERNAME.test(username)}
                testID="profile-next"
              />
            </View>
          )}

          {currentStep === 'style' && (
            <View style={styles.section}>
              <Text style={[styles.subtitle, { color: c.text }]}>{t('register.styleTitle')}</Text>
              <Text style={{ color: c.textMuted }}>{t('register.styleHint')}</Text>
              <View style={styles.grid}>
                {STYLES.map((s) => {
                  const on = styles_.includes(s.id);
                  const color = c.category[s.category];
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() =>
                        setStyles((cur) => (on ? cur.filter((x) => x !== s.id) : [...cur, s.id]))
                      }
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      style={[
                        styles.tile,
                        {
                          borderColor: on ? color : c.border,
                          backgroundColor: on ? color : c.categoryTint[s.category],
                        },
                      ]}
                      testID={`style-${s.id}`}
                    >
                      <CategoryMark category={s.category} size={56} />
                      <Text
                        style={{
                          color: on ? c.onCategory : c.text,
                          fontWeight: '700',
                          textAlign: 'center',
                        }}
                      >
                        {t(`style.${s.id}` as TranslationKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={[styles.guidelines, { backgroundColor: c.surface }]}>
                <Text style={{ color: c.text, fontWeight: '800' }}>
                  {t('register.guidelinesTitle')}
                </Text>
                <Check
                  label={t('register.guidelines')}
                  value={guidelines}
                  onChange={setGuidelines}
                  testID="guidelines"
                />
              </View>
              <Primary
                label={t('register.finish')}
                onPress={finish}
                disabled={busy || styles_.length === 0 || !guidelines}
                testID="finish"
              />
            </View>
          )}

          {message && (
            <Text style={{ color: c.danger }} accessibilityLiveRegion="polite">
              {message}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepDots({ step, withAccount }: { step: string; withAccount: boolean }) {
  const c = useColors();
  const steps = withAccount ? ['account', 'profile', 'style'] : ['profile', 'style'];
  return (
    <View
      style={styles.dots}
      accessibilityLabel={`Step ${steps.indexOf(step) + 1} of ${steps.length}`}
    >
      {steps.map((s) => (
        <View key={s} style={[styles.dot, { backgroundColor: s === step ? c.accent : c.border }]} />
      ))}
    </View>
  );
}

function Primary({
  label,
  onPress,
  disabled,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={[styles.primary, { backgroundColor: disabled ? c.border : c.accent }]}
    >
      <Text style={{ color: disabled ? c.textMuted : c.accentOn, fontWeight: '800', fontSize: 16 }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.xl, gap: space.lg },
  title: { fontSize: 30, fontWeight: '900' },
  subtitle: { fontSize: 20, fontWeight: '800' },
  section: { gap: space.md },
  label: { fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    minHeight: 48,
    fontSize: 16,
  },
  oauth: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    minHeight: 50,
  },
  primary: {
    borderRadius: radius.pill,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: space.xs,
    justifyContent: 'center',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 28, height: 5, borderRadius: 3 },
  guidelines: { borderRadius: radius.md, padding: space.md, gap: space.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    width: '47%',
    borderWidth: 2,
    borderRadius: radius.md,
    padding: space.lg,
    alignItems: 'center',
    gap: space.sm,
    minHeight: 110,
    justifyContent: 'center',
  },
});
