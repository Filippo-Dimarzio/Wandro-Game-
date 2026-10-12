import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { explorerStage, levelProgress } from '@wandro/shared';
import type { Wallet } from '@/data/wallet';
import { t } from '@/i18n';
import { radius, space, useColors } from '@/theme';

/**
 * Your level at a glance: level, rank and XP, with a bar that fills as you earn XP (and starts
 * again from empty on each new level). Tapping it opens the leaderboard.
 */
export function ProgressStrip({ wallet }: { wallet: Wallet }) {
  const c = useColors();
  const lp = levelProgress(wallet.xp);
  const fill = useRef(new Animated.Value(lp.fraction)).current;
  useEffect(() => {
    Animated.timing(fill, {
      toValue: lp.fraction,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [fill, lp.fraction]);
  const label = `${t('home.level', { level: lp.level })} · ${explorerStage(lp.level)}`;
  return (
    <Pressable
      onPress={() => router.push('/leaderboard')}
      style={[styles.strip, { backgroundColor: c.surface }]}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${t('profile.xp', { xp: lp.xpIntoLevel, next: lp.xpForNext })}`}
      accessibilityHint={t('profile.progressHint')}
      testID="progress-strip"
    >
      <View style={styles.row}>
        <Text style={[styles.level, { color: c.text }]}>{label}</Text>
        <Text style={[styles.xp, { color: c.accent }]} testID="xp-count">
          {t('profile.xp', { xp: lp.xpIntoLevel, next: lp.xpForNext })}
        </Text>
      </View>
      <View
        style={[styles.track, { backgroundColor: c.border }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: lp.xpForNext, now: lp.xpIntoLevel }}
        testID="xp-bar"
      >
        <Animated.View
          style={[
            styles.bar,
            {
              backgroundColor: c.accent,
              width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: { borderRadius: radius.md, padding: space.md, gap: space.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  level: { fontWeight: '800', fontSize: 15 },
  xp: { fontWeight: '900', fontSize: 14 },
  track: { height: 12, borderRadius: 6, overflow: 'hidden' },
  bar: { height: 12, borderRadius: 6 },
});
