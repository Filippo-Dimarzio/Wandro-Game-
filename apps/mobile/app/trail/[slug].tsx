import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  formatDistance,
  haversineMeters,
  TRAIL_COMPLETE_COINS,
  TRAIL_HINTS,
  TRAIL_PENALTY,
  TRAIL_STOP_COINS,
  TRAIL_UNLOCK_AFTER,
  TRAIL_UNLOCK_COINS,
  regionBySlug,
} from '@wandro/shared';
import { CATEGORY_META } from '@/categories';
import { FitImage } from '@/components/FitImage';
import { GameBackdrop } from '@/components/GameBackdrop';
import { ScreenHeader } from '@/components/ScreenHeader';
import { trailWalkLabel } from '@/components/TrailCard';
import {
  currentStop,
  trailErrorCode,
  useAnswerClue,
  useStartTrail,
  useTrail,
  useTrailHint,
  type TrailStopView,
  type TrailView,
} from '@/data/trails';
import { useWallet } from '@/data/wallet';
import { t, type TranslationKey } from '@/i18n';
import { column, radius, shadow, space, useColors } from '@/theme';

/**
 * One trail: the story so far, then each stop in order. It unlocks after 5 discoveries in its city
 * and 300 earned coins. The next stop opens its clue once you've discovered the place; the ones
 * after it stay locked until you solve it. Nothing is timed.
 */
export default function TrailScreen() {
  const c = useColors();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { trail, isLoading } = useTrail(slug);

  if (!trail) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <GameBackdrop />
        <ScreenHeader title={t('home.trails')} />
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <Text style={{ color: c.textMuted, padding: space.lg }}>{t('trail.notFound')}</Text>
        )}
      </SafeAreaView>
    );
  }

  const next = currentStop(trail);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <GameBackdrop />
      <ScreenHeader title={trail.title} />
      <ScrollView
        contentContainerStyle={[styles.container, column]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.hero, shadow]}>
          <FitImage
            source={CATEGORY_META[trail.theme].art}
            style={StyleSheet.absoluteFill}
            accessible={false}
          />
        </View>
        <Text style={[styles.meta, { color: c.textMuted }]}>
          {t('trail.stops', { count: trail.stops.length })} · {trailWalkLabel(trail)}
          {trail.startedAt ? '' : ` · ${t('trail.price', { coins: TRAIL_UNLOCK_COINS })}`}
        </Text>
        <Text style={[styles.body, { color: c.text }]}>{trail.intro}</Text>
        <View style={[styles.note, { backgroundColor: c.goldSoft }]}>
          <Ionicons name="time-outline" size={18} color={c.gold} />
          <Text style={{ color: c.text, flex: 1 }}>
            {t('trail.noClock')}{' '}
            {t('trail.worth', { coins: TRAIL_STOP_COINS, bonus: TRAIL_COMPLETE_COINS })}
          </Text>
        </View>

        {!trail.startedAt && <Unlock trail={trail} />}

        <View style={{ gap: space.md }}>
          {trail.stops.map((s, i) => (
            <Stop
              key={s.position}
              trail={trail}
              stop={s}
              legM={i > 0 ? haversineMeters(trail.stops[i - 1]!, s) : null}
              current={!!trail.startedAt && next?.position === s.position}
            />
          ))}
        </View>

        {trail.completedAt && (
          <View style={[styles.done, { backgroundColor: c.accentSoft }]} testID="trail-complete">
            <Text style={[styles.doneTitle, { color: c.accent }]}>
              {t('trail.complete', { coins: TRAIL_COMPLETE_COINS })}
            </Text>
            <Text style={{ color: c.text }}>{trail.outro}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Before a trail starts: locked until you've discovered TRAIL_UNLOCK_AFTER places in its city,
 * then unlocked with coins you've earned (never bought).
 */
function Unlock({ trail }: { trail: TrailView }) {
  const c = useColors();
  const wallet = useWallet();
  const start = useStartTrail();
  const city = regionBySlug(trail.region)?.name ?? '';
  const done = Math.min(trail.discoveries, TRAIL_UNLOCK_AFTER);
  const back = TRAIL_STOP_COINS * trail.stops.length + TRAIL_COMPLETE_COINS;
  const short = TRAIL_UNLOCK_COINS - wallet.coins;

  if (done < TRAIL_UNLOCK_AFTER) {
    return (
      <View style={[styles.lock, { backgroundColor: c.surface }]} testID="trail-locked">
        <View style={styles.lockRow}>
          <Ionicons name="lock-closed" size={20} color={c.textMuted} />
          <Text style={{ color: c.text, flex: 1, fontWeight: '700' }}>
            {t('trail.lockedCity', { count: TRAIL_UNLOCK_AFTER - done, city })}
          </Text>
        </View>
        <View
          style={[styles.bar, { backgroundColor: c.border }]}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('trail.cityProgress', { done, total: TRAIL_UNLOCK_AFTER, city })}
          accessibilityValue={{ min: 0, max: TRAIL_UNLOCK_AFTER, now: done }}
        >
          <View
            style={[
              styles.barFill,
              { backgroundColor: c.accent, width: `${(done / TRAIL_UNLOCK_AFTER) * 100}%` },
            ]}
          />
        </View>
        <Text style={{ color: c.textMuted }}>
          {t('trail.cityProgress', { done, total: TRAIL_UNLOCK_AFTER, city })}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: space.sm }}>
      <Pressable
        onPress={() => start.mutate(trail.slug)}
        disabled={start.isPending || short > 0}
        accessibilityRole="button"
        accessibilityState={{ disabled: start.isPending || short > 0 }}
        style={[styles.primary, { backgroundColor: c.accent, opacity: short > 0 ? 0.5 : 1 }]}
        testID="trail-start"
      >
        <Ionicons name="lock-open" size={18} color={c.accentOn} />
        <Text style={[styles.primaryText, { color: c.accentOn }]}>
          {t('trail.unlock', { coins: TRAIL_UNLOCK_COINS })}
        </Text>
      </Pressable>
      <Text style={{ color: c.textMuted, textAlign: 'center' }}>
        {short > 0
          ? t('trail.needCoins', { count: short })
          : t('trail.balance', { coins: wallet.coins, back })}
      </Text>
      {start.isError && (
        <Text style={{ color: c.danger, textAlign: 'center' }} accessibilityLiveRegion="polite">
          {t(`trail.error.${trailErrorCode(start.error)}` as TranslationKey)}
        </Text>
      )}
    </View>
  );
}

function Stop({
  trail,
  stop,
  legM,
  current,
}: {
  trail: TrailView;
  stop: TrailStopView;
  legM: number | null;
  current: boolean;
}) {
  const c = useColors();
  const status = stop.solved ? 'solved' : current ? 'current' : 'locked';
  // Text on each dot keeps AA contrast in both themes.
  const dot = stop.solved ? c.accent : current ? c.category[trail.theme] : c.surface;
  const onDot = stop.solved ? c.accentOn : current ? c.onCategory : c.textMuted;
  return (
    <View
      style={[
        styles.stop,
        { backgroundColor: c.card, borderColor: current ? dot : c.border },
        current && { borderWidth: 2 },
      ]}
      testID={`trail-stop-${stop.position}`}
    >
      <View
        style={styles.stopHead}
        accessible
        accessibilityLabel={t('trail.stopA11y', {
          n: stop.position,
          place: stop.placeName,
          status: t(`trail.status.${status}` as TranslationKey),
        })}
      >
        <View style={[styles.dot, { backgroundColor: dot, borderColor: c.border }]}>
          {stop.solved ? (
            <Ionicons name="checkmark" size={16} color={onDot} />
          ) : (
            <Text style={[styles.dotText, { color: onDot }]}>{stop.position}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.stopName, { color: status === 'locked' ? c.textMuted : c.text }]}>
            {stop.placeName}
          </Text>
          {legM !== null && (
            <Text style={{ color: c.textMuted, fontSize: 12 }}>
              {t('trail.leg', { distance: formatDistance(legM) })}
            </Text>
          )}
        </View>
        {stop.solved && stop.coins !== null && (
          <Text style={{ color: c.gold, fontWeight: '800' }}>+{stop.coins}</Text>
        )}
      </View>

      {stop.solved && (
        <Text style={{ color: c.textMuted }}>{t('trail.solved', { coins: stop.coins ?? 0 })}</Text>
      )}
      {status === 'locked' && !stop.solved && trail.startedAt && (
        <Text style={{ color: c.textMuted }}>{t('trail.locked')}</Text>
      )}
      {current && <CurrentStop trail={trail} stop={stop} />}
    </View>
  );
}

function CurrentStop({ trail, stop }: { trail: TrailView; stop: TrailStopView }) {
  const c = useColors();
  const hint = useTrailHint();
  const answer = useAnswerClue();
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const fail = (e: unknown) =>
    setFeedback({
      ok: false,
      text: t(`trail.error.${trailErrorCode(e)}` as TranslationKey),
    });

  const submit = (value: string) => {
    if (!value.trim()) return;
    setFeedback(null);
    answer.mutate(
      { slug: trail.slug, position: stop.position, answer: value },
      {
        onSuccess: (r) =>
          setFeedback(
            r.correct
              ? { ok: true, text: t('trail.right', { coins: r.coins }) }
              : { ok: false, text: t('trail.wrong', { coins: TRAIL_PENALTY }) },
          ),
        onError: fail,
      },
    );
  };

  return (
    <View style={{ gap: space.md }}>
      <Text style={[styles.body, { color: c.text }]}>{stop.story}</Text>

      {!stop.discovered ? (
        <View style={{ gap: space.sm }}>
          <Text style={{ color: c.textMuted }}>
            {t('trail.discoverFirst', { place: stop.placeName })}
          </Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(tabs)/explore',
                params: { place: stop.placeId, at: String(Date.now()), guide: '1' },
              })
            }
            accessibilityRole="button"
            style={[styles.primary, { backgroundColor: c.accent }]}
            testID="trail-guide"
          >
            <Ionicons name="navigate" size={18} color={c.accentOn} />
            <Text style={[styles.primaryText, { color: c.accentOn }]}>{t('trail.guideMe')}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.clue, { backgroundColor: c.surface }]}>
          <Text style={[styles.clueLabel, { color: c.category[trail.theme] }]}>
            {t('trail.clue')}
          </Text>
          <Text style={[styles.question, { color: c.text }]} accessibilityRole="header">
            {stop.question}
          </Text>

          {stop.kind === 'choice' && stop.choices ? (
            <View style={{ gap: space.sm }}>
              {stop.choices.map((choice) => (
                <Pressable
                  key={choice}
                  onPress={() => submit(choice)}
                  disabled={answer.isPending}
                  accessibilityRole="button"
                  style={[styles.choice, { backgroundColor: c.card, borderColor: c.border }]}
                  testID={`trail-choice-${choice}`}
                >
                  <Text style={{ color: c.text, fontWeight: '700' }}>{choice}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.numberRow}>
              <TextInput
                value={typed}
                onChangeText={setTyped}
                keyboardType="number-pad"
                accessibilityLabel={t('trail.answerLabel')}
                placeholder={t('trail.answerPlaceholder')}
                placeholderTextColor={c.textMuted}
                onSubmitEditing={() => submit(typed)}
                style={[
                  styles.input,
                  { color: c.text, borderColor: c.border, backgroundColor: c.card },
                ]}
                testID="trail-answer"
              />
              <Pressable
                onPress={() => submit(typed)}
                disabled={answer.isPending || !typed.trim()}
                accessibilityRole="button"
                style={[
                  styles.primary,
                  { backgroundColor: c.accent, opacity: typed.trim() ? 1 : 0.5 },
                ]}
                testID="trail-check"
              >
                <Text style={[styles.primaryText, { color: c.accentOn }]}>{t('trail.check')}</Text>
              </Pressable>
            </View>
          )}

          {feedback && (
            <Text
              style={{ color: feedback.ok ? c.accent : c.danger, fontWeight: '800' }}
              accessibilityLiveRegion="polite"
              testID="trail-feedback"
            >
              {feedback.text}
            </Text>
          )}

          {stop.hints.map((h, i) => (
            <Text key={h} style={{ color: c.text }}>
              <Text style={{ fontWeight: '800' }}>{t('trail.hintN', { n: i + 1 })}: </Text>
              {h}
            </Text>
          ))}
          {stop.hints.length < TRAIL_HINTS ? (
            <Pressable
              onPress={() => {
                setFeedback(null);
                hint.mutate({ slug: trail.slug, position: stop.position }, { onError: fail });
              }}
              disabled={hint.isPending}
              accessibilityRole="button"
              style={[styles.secondary, { borderColor: c.border }]}
              testID="trail-hint"
            >
              <Ionicons name="bulb-outline" size={18} color={c.gold} />
              <Text style={{ color: c.text, fontWeight: '700' }}>
                {t('trail.hint', { coins: TRAIL_PENALTY })}
              </Text>
            </Pressable>
          ) : (
            <Text style={{ color: c.textMuted }}>{t('trail.noHints')}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  hero: { width: '100%', aspectRatio: 3 / 2, borderRadius: radius.lg, overflow: 'hidden' },
  meta: { fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 23 },
  note: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    alignItems: 'flex-start',
  },
  primary: {
    minHeight: 48,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontWeight: '800', fontSize: 16 },
  secondary: {
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stop: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.md,
    gap: space.sm,
  },
  stopHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { fontWeight: '800' },
  stopName: { fontSize: 16, fontWeight: '800' },
  clue: { borderRadius: radius.md, padding: space.md, gap: space.md },
  clueLabel: { fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 },
  question: { fontSize: 17, fontWeight: '800', lineHeight: 24 },
  choice: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.md,
    justifyContent: 'center',
  },
  numberRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  input: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.md,
    fontSize: 17,
  },
  done: { borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  lock: { borderRadius: radius.lg, padding: space.md, gap: space.sm },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  bar: { height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  doneTitle: { fontSize: 18, fontWeight: '900' },
});
