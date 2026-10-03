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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Category } from '@wandro/shared';
import { Check } from '@/components/Check';
import { t, type TranslationKey } from '@/i18n';
import { signInWithProvider, useAuthSession } from '@/lib/auth';
import { isDemo } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/state/session';
import { radius, space, useColors } from '@/theme';

// Each explorer style wears the colour of the category it maps to.
const STYLES: { id: string; icon: keyof typeof Ionicons.glyphMap; category: Category }[] = [
  { id: 'beaches', icon: 'water', category: 'coast' },
  { id: 'nature', icon: 'leaf', category: 'nature' },
  { id: 'castles', icon: 'business', category: 'heritage' },
  { id: 'museums', icon: 'color-palette', category: 'culture' },
  { id: 'music', icon: 'musical-notes', category: 'music_events' },
  { id: 'hidden', icon: 'diamond', category: 'other' },
];

const USERNAME = /^[a-zA-Z0-9_.]{3,24}$/;

export default function Register() {
  const c = useColors();
  const { session } = useAuthSession();
  const completeOnboarding = useSession((s) => s.completeOnboarding);
  const [step, setStep] = useState<'account' | 'profile' | 'style'>(isDemo ? 'profile' : 'account');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [styles_, setStyles] = useState<string[]>([]);
  const [guidelines, setGuidelines] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const currentStep = step === 'account' && session ? 'profile' : step;

  const auth = async (mode: 'signUp' | 'signIn') => {
    if (!supabase) return;
    setBusy(true);
    setMessage(null);
    const res =
      mode === 'signUp'
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (res.error) return setMessage(res.error.message);
    if (!res.data.session) return setMessage(t('register.checkEmail'));
    setStep('profile');
  };

  const finish = async () => {
    setBusy(true);
    setMessage(null);
    if (supabase && session) {
      const { error } = await supabase
        .from('profiles')
        .update({ username, home_city: homeCity || null, explorer_styles: styles_ })
        .eq('id', session.user.id);
      if (error) {
        setBusy(false);
        return setMessage(error.message);
      }
    }
    completeOnboarding({ username, homeCity, explorerStyles: styles_ });
    setBusy(false);
    router.replace('/(tabs)');
  };

  const input = [styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
            {t('register.title')}
          </Text>
          <StepDots step={currentStep} demo={isDemo} />

          {currentStep === 'account' && (
            <View style={styles.section}>
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
              <TextInput
                style={input}
                placeholder={t('register.email')}
                placeholderTextColor={c.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                accessibilityLabel={t('register.email')}
              />
              <TextInput
                style={input}
                placeholder={t('register.password')}
                placeholderTextColor={c.textMuted}
                secureTextEntry
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                accessibilityLabel={t('register.password')}
              />
              <Primary
                label={t('register.signUp')}
                onPress={() => auth('signUp')}
                disabled={busy || !email || password.length < 8}
              />
              <Pressable
                onPress={() => auth('signIn')}
                accessibilityRole="button"
                style={styles.link}
              >
                <Text style={{ color: c.accent, fontWeight: '700' }}>{t('register.signIn')}</Text>
              </Pressable>
            </View>
          )}

          {currentStep === 'profile' && (
            <View style={styles.section}>
              {isDemo && <Text style={{ color: c.textMuted }}>{t('register.demoNote')}</Text>}
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
                      <Ionicons name={s.icon} size={28} color={on ? c.onCategory : color} />
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

function StepDots({ step, demo }: { step: string; demo: boolean }) {
  const c = useColors();
  const steps = demo ? ['profile', 'style'] : ['account', 'profile', 'style'];
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
  link: { alignItems: 'center', padding: space.sm },
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
