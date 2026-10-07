import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { StreakView } from '@wandro/shared';
import { useStreak } from '@/data/wallet';
import { t, type TranslationKey } from '@/i18n';
import { radius, shadow, space, useColors } from '@/theme';

const FLAME = '#FF9600';
const FLAME_SOFT = '#FFF1DC';
const native = Platform.OS !== 'web';
const WEEKDAYS: TranslationKey[] = [
  'streak.mon',
  'streak.tue',
  'streak.wed',
  'streak.thu',
  'streak.fri',
  'streak.sat',
  'streak.sun',
];

/** What the streak says today: kept, at risk, or waiting to start. */
function message(s: StreakView): string {
  if (s.doneToday) return t('streak.safe');
  if (s.atRisk) return t('streak.atRisk', { days: s.days });
  return t('streak.start');
}

/** This week, Monday to Sunday: a flame on each day you completed a challenge. */
export function StreakWeek({ streak }: { streak: StreakView }) {
  const c = useColors();
  return (
    <View style={styles.week} testID="streak-week">
      {streak.week.map((d, i) => (
        <View
          key={d.date}
          style={styles.day}
          accessible
          accessibilityLabel={`${t(WEEKDAYS[i]!)}${d.lit ? `, ${t('streak.dayDone')}` : ''}`}
        >
          <Text style={[styles.dayName, { color: d.today ? FLAME : c.textMuted }]}>
            {t(WEEKDAYS[i]!).slice(0, 1)}
          </Text>
          <View
            style={[
              styles.dot,
              {
                backgroundColor: d.lit ? FLAME : d.future ? 'transparent' : c.surface,
                borderColor: d.today ? FLAME : d.future ? c.border : 'transparent',
              },
            ]}
            testID={d.lit ? 'streak-day-lit' : 'streak-day'}
          >
            {d.lit && <Text style={styles.dotFlame}>🔥</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

/** The flame counter in the Home header. Grey until you complete a challenge today. */
export function StreakFlame() {
  const c = useColors();
  const streak = useStreak();
  const [open, setOpen] = useState(false);
  const lit = streak.doneToday;
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t('streak.title', { days: streak.days })}. ${message(streak)}`}
        style={[styles.pill, { backgroundColor: lit ? FLAME_SOFT : c.surface }]}
        testID="streak-flame"
      >
        <Text style={[styles.pillFlame, !lit && styles.greyed]}>🔥</Text>
        <Text style={[styles.pillDays, { color: lit ? FLAME : c.textMuted }]}>{streak.days}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={styles.scrim}
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={t('streak.close')}
        >
          <View style={[styles.card, shadow, { backgroundColor: c.card }]} testID="streak-sheet">
            <StreakHero streak={streak} />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/** Big flame, the day count, this week and what to do next. */
export function StreakHero({
  streak,
  celebrate = false,
}: {
  streak: StreakView;
  celebrate?: boolean;
}) {
  const c = useColors();
  const pop = useRef(new Animated.Value(celebrate ? 0.3 : 1)).current;
  useEffect(() => {
    if (!celebrate) return;
    AccessibilityInfo.announceForAccessibility?.(t('streak.extended', { days: streak.days }));
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 80, useNativeDriver: native }).start();
  }, [celebrate, pop, streak.days]);
  const wobble = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!streak.doneToday) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: native,
        }),
        Animated.timing(wobble, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: native,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [streak.doneToday, wobble]);
  return (
    <View style={styles.hero}>
      <Animated.Text
        style={[
          styles.bigFlame,
          !streak.doneToday && styles.greyed,
          {
            transform: [
              { scale: pop },
              {
                rotate: wobble.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] }),
              },
            ],
          },
        ]}
        accessible={false}
      >
        🔥
      </Animated.Text>
      <Text style={[styles.count, { color: streak.doneToday ? FLAME : c.text }]}>
        {streak.days}
      </Text>
      <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
        {celebrate
          ? t('streak.extended', { days: streak.days })
          : t('streak.title', { days: streak.days })}
      </Text>
      <StreakWeek streak={streak} />
      <Text style={{ color: c.textMuted, textAlign: 'center' }} testID="streak-message">
        {message(streak)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillFlame: { fontSize: 16 },
  pillDays: { fontSize: 16, fontWeight: '900' },
  greyed: { opacity: 0.35 },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  card: { width: '100%', maxWidth: 380, borderRadius: radius.xl, padding: space.xl },
  hero: { alignItems: 'center', gap: space.sm },
  bigFlame: { fontSize: 72 },
  count: { fontSize: 44, fontWeight: '900', marginTop: -space.md },
  title: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  week: { flexDirection: 'row', gap: 6, marginVertical: space.sm },
  day: { alignItems: 'center', gap: 4 },
  dayName: { fontSize: 12, fontWeight: '800' },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFlame: { fontSize: 16 },
});
