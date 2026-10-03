import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { BADGES } from '@wandro/shared';
import type { CheckinOutcome } from '@/data/checkin';
import { t, type TranslationKey } from '@/i18n';
import { radius, space, useColors } from '@/theme';

/** Counts up from 0 so the coins "land" in the octopus's coin pouch. */
export function useCountUp(target: number, ms = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = Date.now();
    const tick = () => {
      const k = Math.min(1, (Date.now() - start) / ms);
      setValue(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, ms]);
  return value;
}

interface Props {
  placeName: string;
  outcome: CheckinOutcome;
  onDone: () => void;
  onShare?: () => void;
}

export function RewardCard({ placeName, outcome, onDone, onShare }: Props) {
  const c = useColors();
  const coins = useCountUp(outcome.coins ?? 0);
  const pop = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
    if (outcome.status === 'verified') {
      AccessibilityInfo.announceForAccessibility?.(
        `${t('reward.title')} ${t('reward.coins', { coins: outcome.coins ?? 0 })}`,
      );
    }
  }, [pop, outcome]);

  if (outcome.status !== 'verified') {
    const key = (
      outcome.status === 'flagged' ? 'checkin.flagged' : `checkin.rejected.${outcome.reason}`
    ) as TranslationKey;
    return (
      <View
        style={[styles.card, { backgroundColor: c.surface }]}
        accessibilityLiveRegion="polite"
        testID="checkin-outcome"
      >
        <Ionicons
          name={outcome.status === 'flagged' ? 'hourglass' : 'alert-circle'}
          size={28}
          color={c.gold}
        />
        <Text style={{ color: c.text, fontSize: 16 }}>{t(key)}</Text>
        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          style={[styles.button, { backgroundColor: c.accent }]}
        >
          <Text style={{ color: c.accentOn, fontWeight: '800' }}>{t('checkin.tryAgain')}</Text>
        </Pressable>
      </View>
    );
  }

  const badges = (outcome.newBadges ?? [])
    .map((code) => BADGES.find((b) => b.code === code))
    .filter(Boolean);

  return (
    <Animated.View
      style={[styles.card, { backgroundColor: c.accent, transform: [{ scale: pop }] }]}
      testID="reward-card"
    >
      <Text style={styles.octopus} accessibilityElementsHidden>
        🐙
      </Text>
      <Text style={[styles.title, { color: c.accentOn }]} accessibilityRole="header">
        {t('reward.title')}
      </Text>
      <Text style={{ color: c.accentOn, fontSize: 16 }}>{placeName}</Text>
      <Text
        style={[styles.coins, { color: c.accentOn }]}
        accessibilityLabel={t('reward.coins', { coins: outcome.coins ?? 0 })}
      >
        🪙 +{coins}
      </Text>
      {!!outcome.firstDiscovererBonus && (
        <Text style={{ color: c.accentOn, fontWeight: '700' }}>
          🚩 {t('reward.pioneer', { coins: outcome.firstDiscovererBonus })}
        </Text>
      )}
      <View style={styles.row}>
        {outcome.level !== undefined && <Chip text={t('reward.level', { level: outcome.level })} />}
        {outcome.streak !== undefined && (
          <Chip text={`🔥 ${t('reward.streak', { days: outcome.streak })}`} />
        )}
      </View>
      {(outcome.collectionsCompleted?.length ?? 0) > 0 && (
        <Text style={{ color: c.accentOn, fontWeight: '800' }}>🏆 {t('reward.collection')}</Text>
      )}
      {badges.length > 0 && (
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={{ color: c.accentOn, fontWeight: '700' }}>{t('reward.badges')}</Text>
          <View style={styles.row}>
            {badges.map((b) => (
              <Chip key={b!.code} text={`${b!.emoji} ${b!.name}`} />
            ))}
          </View>
        </View>
      )}
      <View style={styles.row}>
        {onShare && (
          <Pressable
            onPress={onShare}
            accessibilityRole="button"
            style={[styles.button, { backgroundColor: c.accentOn }]}
          >
            <Text style={{ color: c.accent, fontWeight: '800' }}>📷 {t('reward.share')}</Text>
          </Pressable>
        )}
        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          style={[styles.button, { borderColor: c.accentOn, borderWidth: 2 }]}
        >
          <Text style={{ color: c.accentOn, fontWeight: '800' }}>{t('reward.done')}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <View style={styles.chip}>
      <Text style={{ color: '#fff', fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.xl, gap: space.sm, alignItems: 'center' },
  octopus: { fontSize: 56 },
  title: { fontSize: 26, fontWeight: '900' },
  coins: { fontSize: 40, fontWeight: '900' },
  row: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap', justifyContent: 'center' },
  chip: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  button: {
    borderRadius: radius.pill,
    minHeight: 46,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
