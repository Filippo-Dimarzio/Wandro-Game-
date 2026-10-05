import { useEffect, useState } from 'react';
import { AccessibilityInfo, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { regionBySlug, regionFor, type Place } from '@wandro/shared';
import { Fireworks } from '@/components/Fireworks';
import { PostageStamp } from '@/components/PostageStamp';
import type { CheckinOutcome } from '@/data/checkin';
import { useCities } from '@/data/cities';
import { t } from '@/i18n';
import { radius, space } from '@/theme';

/**
 * The big moment after a check-in: a new city stamp slams onto the screen with fireworks, and
 * finishing every set in a city (claiming the whole city) gets the same show with a bigger title.
 */
export function CityCelebration({ place, outcome }: { place: Place; outcome: CheckinOutcome }) {
  const cities = useCities();
  const [open, setOpen] = useState(true);
  const [still, setStill] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((r) => setStill(!!r))
      .catch(() => undefined);
  }, []);

  if (outcome.status !== 'verified') return null;
  const slug = outcome.stamp?.region ?? place.region ?? regionFor(place)?.slug;
  const city = cities.find((c) => c.region.slug === slug);
  const region = slug ? regionBySlug(slug) : undefined;
  if (!city || !region) return null;
  const claimed =
    city.total > 0 &&
    city.done === city.total &&
    city.sets.some((s) => s.places.some((p) => p.id === place.id));
  const newStamp = !!outcome.stamp;
  if (!open || (!newStamp && !claimed)) return null;
  const gold = outcome.stamp?.gold ?? city.gold;

  const title = claimed
    ? t('celebrate.claimed', { city: region.name })
    : t(gold ? 'celebrate.goldStamp' : 'celebrate.stamp', { city: region.name });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.scrim} testID="city-celebration" accessibilityViewIsModal>
        {!still && <Fireworks bursts={claimed ? 10 : 7} testID="fireworks" />}
        <View style={styles.content}>
          <Text style={styles.kicker}>
            {claimed ? '🏆' : '📮'} {t('celebrate.kicker')}
          </Text>
          <Text style={styles.title} accessibilityRole="header" accessibilityLiveRegion="polite">
            {title}
          </Text>
          <PostageStamp
            region={region}
            value={city.done}
            width={170}
            tilt={-6}
            gold={gold}
            animate={!still}
            testID="celebration-stamp"
          />
          <Text style={styles.text}>
            {claimed ? t('celebrate.claimedText', { count: city.total }) : t('celebrate.stampText')}
          </Text>
          <Pressable
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            style={styles.cta}
            testID="celebration-done"
          >
            <Text style={styles.ctaText}>{t('celebrate.continue')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(8,16,40,0.88)' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
    gap: space.lg,
  },
  kicker: { color: '#FFE9A8', fontWeight: '900', letterSpacing: 1.5 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  text: { color: '#fff', textAlign: 'center', fontSize: 16, maxWidth: 360 },
  cta: {
    backgroundColor: '#fff',
    borderRadius: radius.pill,
    minHeight: 52,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#0B3A5E', fontWeight: '900', fontSize: 17 },
});
