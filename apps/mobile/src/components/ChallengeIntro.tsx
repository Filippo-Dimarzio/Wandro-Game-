import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  CHALLENGE_XP,
  DEFAULT_REGION,
  formatDistance,
  haversineMeters,
  pointsForVisit,
  regionBySlug,
  regionFor,
  type Place,
} from '@wandro/shared';
import { placeImage } from '@/categories';
import { CoinIcon } from '@/components/CoinIcon';
import { CategoryPill } from '@/components/PlaceBits';
import { PostageStamp } from '@/components/PostageStamp';
import { TimeQuestBadge } from '@/components/TimeQuestBadge';
import { useUnlockedIds } from '@/data/places';
import { t } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { useChallengeIntro } from '@/state/challengeIntro';
import { radius, shadow, space, useColors } from '@/theme';

const native = Platform.OS !== 'web';

/** The hook: the place's one-liner, or the start of its description. */
export function introText(place: Place): string {
  if (place.details?.teaser) return place.details.teaser;
  const d = place.description.trim();
  if (d.length <= 180) return d;
  const cut = d.slice(0, 180);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

/**
 * The card a challenge opens with, before you set off: the place as a postage stamp (clean until
 * you collect it, then postmarked), what it pays and a short teaser to make you want to go.
 * "Let's go" starts guiding you there on the map; "Read more" opens its full About, Learn and
 * Plan sheet.
 */
export function ChallengeIntro() {
  const place = useChallengeIntro((s) => s.place);
  const hide = useChallengeIntro((s) => s.hide);
  if (!place) return null;
  return <IntroCard place={place} onClose={hide} />;
}

function IntroCard({ place, onClose }: { place: Place; onClose: () => void }) {
  const c = useColors();
  const loc = useLocation();
  const { ids } = useUnlockedIds();
  const found = ids.has(place.id);
  const coins = pointsForVisit(place.category, place.uniqueVisitors, place.basePoints).total;
  const region = (place.region && regionBySlug(place.region)) || regionFor(place) || DEFAULT_REGION;
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    pop.setValue(0);
    Animated.timing(pop, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: native,
    }).start();
  }, [place.id, pop]);

  const go = (guide: boolean) => {
    onClose();
    router.push({
      pathname: '/(tabs)/explore',
      // `at` re-opens the place even if the map already has it in its params.
      params: {
        place: place.id,
        at: String(Date.now()),
        ...(guide ? { guide: '1' } : { open: 'sheet' }),
      },
    });
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('intro.close')}
        />
        <Animated.View
          style={[
            styles.card,
            shadow,
            { backgroundColor: c.card },
            {
              opacity: pop,
              transform: [
                { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
              ],
            },
          ]}
          testID="challenge-intro"
        >
          <ScrollView contentContainerStyle={styles.content} bounces={false}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('intro.close')}
              hitSlop={10}
              style={styles.close}
            >
              <Ionicons name="close" size={22} color={c.textMuted} />
            </Pressable>
            <View style={[styles.stampDesk, { backgroundColor: c.goldSoft }]}>
              <PostageStamp
                region={region}
                art={placeImage(place)}
                value={coins}
                width={150}
                tilt={-3}
                postmark={found}
                animate
                label={t(found ? 'intro.stampFound' : 'intro.stamp', { place: place.name })}
                testID="intro-stamp"
              />
            </View>
            <View style={styles.row}>
              <CategoryPill category={place.category} />
              <TimeQuestBadge place={place} />
            </View>
            <Text style={[styles.name, { color: c.text }]} accessibilityRole="header">
              {place.name}
            </Text>
            <Text style={[styles.teaser, { color: c.text }]} testID="intro-teaser">
              {introText(place)}
            </Text>
            {place.details?.lookFor && (
              <Text style={{ color: c.textMuted }}>
                👀 {t('intro.lookFor', { what: place.details.lookFor })}
              </Text>
            )}
            <View style={[styles.rewards, { backgroundColor: c.surface }]}>
              <View style={styles.reward}>
                <CoinIcon size={16} />
                <Text style={[styles.rewardText, { color: c.text }]}>
                  {t('intro.coins', { coins })}
                </Text>
              </View>
              <Text style={[styles.rewardText, { color: c.text }]}>
                ⭐ {t('intro.xp', { xp: CHALLENGE_XP })}
              </Text>
              <Text style={[styles.rewardText, { color: c.textMuted }]}>
                📍 {formatDistance(haversineMeters(loc.position, place))}
              </Text>
            </View>
            {found && (
              <Text style={{ color: c.accent, fontWeight: '800' }}>✓ {t('intro.found')}</Text>
            )}
            <Pressable
              onPress={() => go(!found)}
              accessibilityRole="button"
              style={[styles.primary, { backgroundColor: c.accent }]}
              testID="intro-go"
            >
              <Text style={{ color: c.accentOn, fontWeight: '900', fontSize: 16 }}>
                {found ? t('intro.seeOnMap') : t('intro.go')}
              </Text>
            </Pressable>
            {!found && (
              <Pressable
                onPress={() => go(false)}
                accessibilityRole="button"
                style={styles.secondary}
                testID="intro-more"
              >
                <Text style={{ color: c.accent, fontWeight: '800' }}>{t('intro.more')}</Text>
              </Pressable>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  card: { width: '100%', maxWidth: 400, maxHeight: '92%', borderRadius: radius.xl },
  content: { padding: space.lg, gap: space.sm, alignItems: 'stretch' },
  close: { position: 'absolute', top: space.md, right: space.md, zIndex: 2 },
  stampDesk: {
    alignItems: 'center',
    paddingVertical: space.lg,
    borderRadius: radius.lg,
    marginBottom: space.xs,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  name: { fontSize: 24, fontWeight: '900' },
  teaser: { fontSize: 16, lineHeight: 23 },
  rewards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: space.sm,
    borderRadius: radius.md,
    padding: space.sm,
  },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rewardText: { fontWeight: '800' },
  primary: {
    borderRadius: radius.pill,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.xs,
  },
  secondary: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
});
