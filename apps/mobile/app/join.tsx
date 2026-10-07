import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  cleanSource,
  EXPLORER_IDS,
  WAITLIST_FOG_WALK,
  WAITLIST_INTERESTS,
  WAITLIST_LIVES,
  WAITLIST_OCCUPATIONS,
  WAITLIST_TRANSPORT,
  waitlistErrors,
  type WaitlistField,
  type WaitlistSignup,
} from '@wandro/shared';
import { GameBackdrop } from '@/components/GameBackdrop';
import { Check } from '@/components/Check';
import { explorerImage } from '@/components/ExplorerAvatar';
import { WandroLogo } from '@/components/WandroLogo';
import { useJoinWaitlist, WaitlistNotConnected } from '@/data/waitlist';
import { t, type TranslationKey } from '@/i18n';
import { column, radius, space, useColors } from '@/theme';

const BRAND = '#0E7C66';
const CREAM = '#FBF1E4';

const REASONS: { icon: keyof typeof Ionicons.glyphMap; key: string }[] = [
  { icon: 'gift-outline', key: 'free' },
  { icon: 'diamond-outline', key: 'rare' },
  { icon: 'train-outline', key: 'transit' },
];

type Draft = Partial<WaitlistSignup> & {
  transport: WaitlistSignup['transport'];
  interests: WaitlistSignup['interests'];
};

/** The beta waitlist: who you are, how you get around, what you'd explore first. */
export default function Join() {
  const c = useColors();
  const { src } = useLocalSearchParams<{ src?: string }>();
  const join = useJoinWaitlist();
  const [draft, setDraft] = useState<Draft>({ transport: [], interests: [], consent: false });
  const [tried, setTried] = useState(false);
  const errors = waitlistErrors(draft);
  const show = (f: WaitlistField) => tried && errors.includes(f);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const toggle = <K extends 'transport' | 'interests'>(key: K, value: Draft[K][number]) =>
    setDraft((d) => {
      const list = d[key] as string[];
      return {
        ...d,
        [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value],
      };
    });

  const submit = () => {
    setTried(true);
    if (errors.length) return;
    join.mutate({ ...(draft as WaitlistSignup), source: cleanSource(src) });
  };

  if (join.isSuccess) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <GameBackdrop />
        <View style={[styles.done, column]} testID="join-done">
          <WandroLogo size={72} />
          <Text style={[styles.doneTitle, { color: c.text }]} accessibilityRole="header">
            {t('join.doneTitle')}
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 16, textAlign: 'center' }}>
            {t('join.doneBody')}
          </Text>
          <Primary label={t('join.tryDemo')} onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    );
  }

  const notConnected = join.error instanceof WaitlistNotConnected;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom']}>
      <GameBackdrop />
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
        <View style={styles.hero}>
          <SafeAreaView edges={['top']} style={[styles.heroInner, column]}>
            <View style={styles.brand}>
              <WandroLogo size={44} />
              <Text style={styles.brandName}>Wandro</Text>
            </View>
            <Text style={styles.title} accessibilityRole="header">
              {t('join.title')}
            </Text>
            <Text style={styles.tagline}>{t('join.tagline')}</Text>
            <View style={styles.crowd} accessible={false}>
              {EXPLORER_IDS.map((id, i) => (
                <Image
                  key={id}
                  source={explorerImage(id)}
                  style={[styles.face, { marginLeft: i === 0 ? 0 : -12, zIndex: 10 - i }]}
                />
              ))}
            </View>
          </SafeAreaView>
        </View>

        <View style={[styles.body, column]}>
          <View style={styles.reasons}>
            {REASONS.map((r) => (
              <View key={r.key} style={[styles.reason, { backgroundColor: c.surface }]}>
                <Ionicons name={r.icon} size={22} color={BRAND} />
                <Text style={{ color: c.text, fontWeight: '800' }}>
                  {t(`join.reason.${r.key}` as TranslationKey)}
                </Text>
                <Text style={{ color: c.textMuted, fontSize: 13 }}>
                  {t(`join.reason.${r.key}Body` as TranslationKey)}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>{t('join.formTitle')}</Text>

            <Label text={t('join.email')} required />
            <TextInput
              value={draft.email ?? ''}
              onChangeText={(email) => set({ email })}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="ana@example.pt"
              placeholderTextColor={c.textMuted}
              accessibilityLabel={t('join.email')}
              testID="join-email"
              style={[
                styles.input,
                {
                  color: c.text,
                  borderColor: show('email') ? c.danger : c.border,
                  backgroundColor: c.bg,
                },
              ]}
            />
            {show('email') && <Missing text={t('join.emailError')} />}

            <Label text={t('join.firstName')} />
            <TextInput
              value={draft.firstName ?? ''}
              onChangeText={(firstName) => set({ firstName })}
              autoComplete="given-name"
              accessibilityLabel={t('join.firstName')}
              style={[
                styles.input,
                { color: c.text, borderColor: c.border, backgroundColor: c.bg },
              ]}
            />

            <Label text={t('join.livesIn')} required />
            <Chips
              options={WAITLIST_LIVES}
              labelKey="join.lives"
              selected={draft.livesIn ? [draft.livesIn] : []}
              onPress={(livesIn) => set({ livesIn })}
              single
              testID="lives"
            />
            {show('livesIn') && <Missing text={t('join.pickOne')} />}

            <Label text={t('join.occupation')} required />
            <Chips
              options={WAITLIST_OCCUPATIONS}
              labelKey="join.occ"
              selected={draft.occupation ? [draft.occupation] : []}
              onPress={(occupation) => set({ occupation })}
              single
              testID="occ"
            />
            {show('occupation') && <Missing text={t('join.pickOne')} />}

            <Label text={t('join.transport')} hint={t('join.pickAny')} />
            <Chips
              options={WAITLIST_TRANSPORT}
              labelKey="join.transport"
              selected={draft.transport}
              onPress={(v) => toggle('transport', v)}
              testID="transport"
            />

            <Label text={t('join.interests')} hint={t('join.pickAny')} />
            <Chips
              options={WAITLIST_INTERESTS}
              labelKey="category"
              selected={draft.interests}
              onPress={(v) => toggle('interests', v)}
              testID="interests"
            />

            <Label text={t('join.fogWalk')} required />
            <Text style={{ color: c.textMuted, fontSize: 13 }}>{t('join.fogWalkHint')}</Text>
            <Chips
              options={WAITLIST_FOG_WALK}
              labelKey="join.fog"
              selected={draft.fogWalk ? [draft.fogWalk] : []}
              onPress={(fogWalk) => set({ fogWalk })}
              single
              testID="fog"
            />
            {show('fogWalk') && <Missing text={t('join.pickOne')} />}

            <View style={{ marginTop: space.md }}>
              <Check
                label={t('join.consent')}
                value={!!draft.consent}
                onChange={(consent) => set({ consent })}
                testID="join-consent"
              />
              {show('consent') && <Missing text={t('join.consentError')} />}
              <Pressable onPress={() => router.push('/privacy')} accessibilityRole="link">
                <Text style={{ color: c.accent, fontWeight: '700', marginTop: space.sm }}>
                  {t('join.privacy')}
                </Text>
              </Pressable>
            </View>

            {notConnected && (
              <Text style={{ color: c.textMuted }} accessibilityLiveRegion="polite">
                {t('join.notConnected')}
              </Text>
            )}
            {join.isError && !notConnected && (
              <Text style={{ color: c.danger }} accessibilityLiveRegion="polite">
                {t('join.failed')}
              </Text>
            )}
            {tried && errors.length > 0 && (
              <Text style={{ color: c.danger, fontWeight: '700' }} accessibilityLiveRegion="polite">
                {t('join.fixAbove')}
              </Text>
            )}
            <Primary
              label={join.isPending ? t('join.sending') : t('join.submit')}
              onPress={submit}
              disabled={join.isPending}
              testID="join-submit"
            />
          </View>

          <Pressable onPress={() => router.replace('/')} accessibilityRole="link">
            <Text style={{ color: c.accent, fontWeight: '800', textAlign: 'center' }}>
              {t('join.tryDemoFirst')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ text, required, hint }: { text: string; required?: boolean; hint?: string }) {
  const c = useColors();
  return (
    <Text style={[styles.label, { color: c.text }]}>
      {text}
      {required ? <Text style={{ color: c.danger }}> *</Text> : null}
      {hint ? <Text style={{ color: c.textMuted, fontWeight: '400' }}> · {hint}</Text> : null}
    </Text>
  );
}

function Missing({ text }: { text: string }) {
  const c = useColors();
  return <Text style={{ color: c.danger, fontSize: 13 }}>{text}</Text>;
}

function Chips<T extends string>({
  options,
  labelKey,
  selected,
  onPress,
  single,
  testID,
}: {
  options: readonly T[];
  labelKey: string;
  selected: readonly string[];
  onPress: (value: T) => void;
  single?: boolean;
  testID: string;
}) {
  const c = useColors();
  return (
    <View style={styles.chips} accessibilityRole={single ? 'radiogroup' : undefined}>
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <Pressable
            key={o}
            onPress={() => onPress(o)}
            accessibilityRole={single ? 'radio' : 'checkbox'}
            accessibilityState={{ checked: on }}
            testID={`${testID}-${o}`}
            style={[
              styles.chip,
              { borderColor: on ? BRAND : c.border, backgroundColor: on ? BRAND : c.bg },
            ]}
          >
            <Text style={{ color: on ? CREAM : c.text, fontWeight: '700' }}>
              {t(`${labelKey}.${o}` as TranslationKey)}
            </Text>
          </Pressable>
        );
      })}
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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      testID={testID}
      style={[styles.primary, { opacity: disabled ? 0.6 : 1 }]}
    >
      <Text style={{ color: CREAM, fontWeight: '900', fontSize: 17 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: BRAND, paddingBottom: space.xl },
  heroInner: { paddingHorizontal: space.xl, paddingTop: space.xl, gap: space.md },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  brandName: { color: CREAM, fontSize: 24, fontWeight: '900' },
  title: { color: CREAM, fontSize: 32, fontWeight: '900', lineHeight: 38 },
  tagline: { color: CREAM, fontSize: 17, opacity: 0.9 },
  crowd: { flexDirection: 'row', marginTop: space.sm },
  face: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: CREAM },
  body: { padding: space.xl, gap: space.xl },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  reason: { flexGrow: 1, flexBasis: 160, borderRadius: radius.md, padding: space.md, gap: 4 },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  cardTitle: { fontSize: 20, fontWeight: '900', marginBottom: space.xs },
  label: { fontWeight: '800', marginTop: space.md },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    minHeight: 48,
    fontSize: 16,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    minHeight: 40,
    justifyContent: 'center',
  },
  primary: {
    marginTop: space.lg,
    backgroundColor: BRAND,
    borderRadius: radius.pill,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  done: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    padding: space.xl,
  },
  doneTitle: { fontSize: 30, fontWeight: '900', textAlign: 'center' },
});
