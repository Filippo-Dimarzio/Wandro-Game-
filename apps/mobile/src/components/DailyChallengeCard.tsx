import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Place } from '@wandro/shared';
import { CATEGORY_META, WANDER_ART } from '@/categories';
import { useDailyChallenge } from '@/data/challenge';
import { t } from '@/i18n';
import { radius, shadow, space, useColors } from '@/theme';
import { HoldToConfirm } from './HoldToConfirm';

function formatRemaining(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function DailyChallengeCard({ places }: { places: Place[] }) {
  const c = useColors();
  const { challenge, confirm } = useDailyChallenge(places);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!challenge) {
    return (
      <View style={[styles.card, { backgroundColor: c.surface }]}>
        <Text style={{ color: c.textMuted }}>{t('challenge.none')}</Text>
      </View>
    );
  }

  const remaining = new Date(challenge.expiresAt).getTime() - now;
  const expired = remaining <= 0 && !challenge.completedAt;
  const cat = challenge.category;
  const accent = cat ? c.category[cat] : c.accent;

  return (
    <View style={[styles.card, shadow, { backgroundColor: c.card }]} testID="daily-challenge">
      <View style={styles.cover}>
        <Image
          source={cat ? CATEGORY_META[cat].art : WANDER_ART}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessible={false}
        />
        <View style={[styles.kickerPill, { backgroundColor: c.goldSoft }]}>
          <Ionicons name="flash" size={14} color={c.gold} accessibilityElementsHidden />
          <Text style={[styles.kicker, { color: c.gold }]}>{t('challenge.title')}</Text>
        </View>
        <View style={[styles.bonusPill, { backgroundColor: accent }]}>
          <Text style={{ color: cat ? c.onCategory : c.accentOn, fontWeight: '800' }}>
            {challenge.isReady || challenge.completedAt
              ? `${t('challenge.bonus', { points: challenge.bonusPoints })} · ${t('challenge.double')}`
              : `🪙 ${t('challenge.double')}`}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
          {challenge.title}
        </Text>
        <Text style={{ color: c.textMuted }}>{challenge.description}</Text>
        {!challenge.completedAt && !expired && (
          <Text style={[styles.timer, { color: c.textMuted }]}>
            {t('challenge.endsIn', { time: formatRemaining(remaining) })}
          </Text>
        )}
        {cat && !challenge.completedAt && !expired && (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/discover/[category]', params: { category: cat } })
            }
            accessibilityRole="link"
            style={styles.link}
          >
            <Text style={{ color: accent, fontWeight: '800' }}>
              {t('challenge.explore', { category: t(`category.${cat}`) })}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={accent} />
          </Pressable>
        )}

        <View style={{ marginTop: space.sm }}>
          {challenge.completedAt ? (
            <View style={styles.row}>
              <Ionicons name="checkmark-circle" size={20} color={c.accent} />
              <Text style={{ color: c.accent, fontWeight: '700' }}>
                {t('challenge.done', { points: challenge.bonusPoints })}
              </Text>
            </View>
          ) : expired ? (
            <Text style={{ color: c.textMuted }}>{t('challenge.expired')}</Text>
          ) : (
            <>
              <HoldToConfirm
                testID="confirm-challenge"
                label={challenge.isReady ? t('challenge.hold') : t('challenge.notReady')}
                accessibilityLabel={t('challenge.holdA11y')}
                disabled={!challenge.isReady || confirm.isPending}
                onConfirm={() => confirm.mutate(challenge)}
              />
              {confirm.isError && (
                <Text style={{ color: c.danger, marginTop: space.sm }}>{t('common.error')}</Text>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  cover: {
    height: 130,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: space.md,
  },
  kickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bonusPill: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  body: { padding: space.lg, gap: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  kicker: {
    fontWeight: '800',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  title: { fontSize: 20, fontWeight: '800' },
  timer: { fontSize: 13, marginTop: space.xs },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
});
