import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { BADGES, regionBySlug } from '@wandro/shared';
import type { CheckinOutcome } from '@/data/checkin';
import { CoinIcon } from '@/components/CoinIcon';
import { ExplorerAvatar } from '@/components/ExplorerAvatar';
import { useMyExplorer } from '@/data/explorer';
import { useLoadout } from '@/data/loadout';
import { useStreak } from '@/data/wallet';
import { StreakHero } from '@/components/Streak';
import { lisbonDate } from '@/demo/engine';
import { useSession } from '@/state/session';
import { t, type TranslationKey } from '@/i18n';
import { radius, space, useColors } from '@/theme';

/** Counts up from 0 so the coins "land" in your explorer's pouch. */
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
  const explorer = useMyExplorer();
  const loadout = useLoadout();
  const coins = useCountUp(outcome.coins ?? 0);
  const pop = useRef(new Animated.Value(0.8)).current;
  // First challenge of the day: the streak flame lights up, Duolingo style (once a day).
  const streak = useStreak();
  const celebrated = useSession((s) => s.prefs.streakCelebrated);
  const markCelebrated = useSession((s) => s.markStreakCelebrated);
  const [showStreak, setShowStreak] = useState(false);
  useEffect(() => {
    const today = lisbonDate(new Date());
    if (outcome.status !== 'verified' || !streak.doneToday || celebrated === today) return;
    setShowStreak(true);
    markCelebrated(today);
  }, [outcome.status, streak.doneToday, celebrated, markCelebrated]);
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
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <ExplorerAvatar explorer={explorer} skin={loadout.skin} hat={loadout.hat} size={64} />
      </View>
      <Text style={[styles.title, { color: c.accentOn }]} accessibilityRole="header">
        {t('reward.title')}
      </Text>
      {showStreak && (
        <View style={[styles.streak, { backgroundColor: c.card }]} testID="reward-streak">
          <StreakHero streak={streak} celebrate />
        </View>
      )}
      <Text style={{ color: c.accentOn, fontSize: 16 }}>{placeName}</Text>
      <View style={styles.coinRow}>
        <CoinIcon size={40} />
        <Text
          style={[styles.coins, { color: c.accentOn }]}
          accessibilityLabel={t('reward.coins', { coins: outcome.coins ?? 0 })}
        >
          +{coins}
        </Text>
      </View>
      {!!outcome.firstDiscovererBonus && (
        <Text style={{ color: c.accentOn, fontWeight: '700' }}>
          🚩 {t('reward.pioneer', { coins: outcome.firstDiscovererBonus })}
        </Text>
      )}
      <View style={styles.row}>
        {outcome.level !== undefined && <Chip text={t('reward.level', { level: outcome.level })} />}
        {outcome.streak !== undefined && !showStreak && (
          <Chip text={`🔥 ${t('reward.streak', { days: outcome.streak })}`} />
        )}
      </View>
      {!!outcome.setCoins && (
        <Text style={{ color: c.accentOn, fontWeight: '700' }} testID="reward-sets">
          🧩 {t('reward.sets', { coins: outcome.setCoins })}
        </Text>
      )}
      {!!outcome.timeQuestBonus && (
        <Text style={{ color: c.accentOn, fontWeight: '700' }} testID="reward-time-quest">
          🗝️ {t('reward.timeQuest', { coins: outcome.timeQuestBonus })}
        </Text>
      )}
      {!!outcome.beaconBonus && (
        <Text style={{ color: c.accentOn, fontWeight: '700' }} testID="reward-beacon">
          🔥 {t('reward.beacon', { coins: outcome.beaconBonus })}
        </Text>
      )}
      {outcome.stamp && (
        <Text style={{ color: c.accentOn, fontWeight: '800' }} testID="reward-stamp">
          {outcome.stamp.gold ? '✨ ' : '📮 '}
          {t(outcome.stamp.gold ? 'reward.goldStamp' : 'reward.stamp', {
            city: regionBySlug(outcome.stamp.region)?.name ?? outcome.stamp.region,
          })}
        </Text>
      )}
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
  title: { fontSize: 26, fontWeight: '900' },
  streak: { alignSelf: 'stretch', borderRadius: radius.lg, padding: space.md },
  coins: { fontSize: 40, fontWeight: '900' },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
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
