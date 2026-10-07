import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORY_META } from '@/categories';
import { AnimatedCard } from '@/components/AnimatedCard';
import { FeedCard } from '@/components/FeedCard';
import { LiveInset } from '@/components/LiveInset';
import { PhotoSheet } from '@/components/PhotoSheet';
import { usePlaces } from '@/data/places';
import { momentExpiry, useFeed, useShareable, type FeedItem } from '@/data/social';
import { t } from '@/i18n';
import { timeAgo } from '@/lib/time';
import { useLocation } from '@/lib/useLocation';
import { radius, shadow, space, useColors } from '@/theme';

/**
 * Today's moments, as a grid of small boxes. Share a photo of a discovery and you see what the
 * people you follow shared in the last 24 hours; after that their moments are gone from here and
 * live on only in each author's own passport.
 */
export function Moments() {
  const c = useColors();
  const feed = useFeed();
  const shareable = useShareable();
  const [open, setOpen] = useState<FeedItem | null>(null);
  const [sharing, setSharing] = useState(false);
  const places = usePlaces(useLocation().position).data ?? [];
  const shareablePlace = places.find((p) => p.id === shareable) ?? null;
  const others = feed.items.filter((i) => !i.isMine);
  const mine = feed.items.filter((i) => i.isMine);
  // Keep the open card in sync with likes.
  const current = open && feed.items.find((i) => i.id === open.id);

  return (
    <View style={{ gap: space.sm }} testID="moments">
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
            {t('moments.title')}
          </Text>
          <LiveDot />
        </View>
        <Pressable
          onPress={() => router.push('/passport')}
          accessibilityRole="button"
          style={[styles.passport, { backgroundColor: c.surface }]}
          testID="open-passport"
        >
          <Ionicons name="book-outline" size={16} color={c.text} />
          <Text style={{ color: c.text, fontWeight: '800', fontSize: 13 }}>
            {t('passport.open')}
          </Text>
        </Pressable>
      </View>

      {!feed.status.unlocked ? (
        <View style={[styles.locked, { backgroundColor: c.surface }]} testID="moments-locked">
          <View style={styles.grid}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={styles.lockedTile}
                accessible
                accessibilityLabel={t('moments.lockedTile')}
              >
                <LinearGradient
                  colors={['#7E8C99', '#B8C4CE', '#DCE3E9']}
                  start={{ x: 0, y: i % 2 }}
                  end={{ x: 1, y: 1 - (i % 2) }}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="lock-closed" size={22} color="#fff" />
              </View>
            ))}
          </View>
          <Text style={{ color: c.text, textAlign: 'center' }}>
            {shareable ? t('moments.locked') : t('moments.lockedNoVisit')}
          </Text>
          {shareable && (
            <Pressable
              onPress={() => setSharing(true)}
              accessibilityRole="button"
              style={[styles.cta, { backgroundColor: c.accent }]}
              testID="share-moment"
            >
              <Ionicons name="camera" size={18} color={c.accentOn} />
              <Text style={{ color: c.accentOn, fontWeight: '800' }}>{t('moments.post')}</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>{t('moments.rule')}</Text>
          <View style={styles.grid}>
            {[...mine, ...others].map((item, i) => (
              <Tile key={item.id} item={item} index={i} onPress={() => setOpen(item)} />
            ))}
          </View>
          {others.length === 0 && (
            <Pressable onPress={() => router.push('/search')} accessibilityRole="button">
              <Text style={{ color: c.textMuted }}>
                {t('moments.empty')}{' '}
                <Text style={{ color: c.accent, fontWeight: '800' }}>{t('feed.findPeople')} →</Text>
              </Text>
            </Pressable>
          )}
        </>
      )}

      {sharing && <PhotoSheet place={shareablePlace} onClose={() => setSharing(false)} />}

      <Modal
        visible={!!current}
        animationType="fade"
        transparent
        onRequestClose={() => setOpen(null)}
      >
        <SafeAreaView style={styles.scrim}>
          <Pressable
            onPress={() => setOpen(null)}
            accessibilityRole="button"
            accessibilityLabel={t('moments.close')}
            style={[styles.close, { backgroundColor: c.card }]}
            testID="close-moment"
          >
            <Ionicons name="close" size={22} color={c.text} />
          </Pressable>
          <ScrollView contentContainerStyle={styles.sheet}>
            {current && <FeedCard item={current} />}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

/** A pulsing red dot: moments pop in live as your friends complete challenges. */
function LiveDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: native }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: native }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={styles.live} accessible accessibilityLabel={t('moments.live')}>
      <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
      <Text style={styles.liveText}>{t('photo.liveTag')}</Text>
    </View>
  );
}

const native = Platform.OS !== 'web';

function Tile({ item, index, onPress }: { item: FeedItem; index: number; onPress: () => void }) {
  const c = useColors();
  const hoursLeft = Math.max(1, Math.ceil((momentExpiry(item.createdAt) - Date.now()) / 3_600_000));
  const who = item.isMine ? t('moments.yours') : item.username;
  return (
    <AnimatedCard
      index={index}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${who}, ${item.placeName}`}
      style={[styles.tile, shadow, { backgroundColor: c.card }]}
      testID="moment-tile"
    >
      <Image
        source={item.photoUrl ? { uri: item.photoUrl } : CATEGORY_META[item.category].art}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessible={false}
      />
      {item.selfieUrl && <LiveInset uri={item.selfieUrl} size={28} />}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.caption}
        pointerEvents="none"
      >
        <Text style={styles.who} numberOfLines={1}>
          {who}
        </Text>
        <Text style={styles.when} numberOfLines={1}>
          {item.isMine ? t('moments.timeLeft', { hours: hoursLeft }) : timeAgo(item.createdAt)}
        </Text>
      </LinearGradient>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '800' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E53E3E',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  passport: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    minHeight: 36,
  },
  locked: { borderRadius: radius.lg, padding: space.md, gap: space.md, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignSelf: 'stretch' },
  tile: { width: '31.5%', aspectRatio: 1, borderRadius: radius.md },
  lockedTile: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 6,
    paddingTop: 16,
    paddingBottom: 5,
  },
  who: { color: '#fff', fontWeight: '800', fontSize: 12 },
  when: { color: '#fff', fontSize: 11 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    minHeight: 44,
  },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  close: {
    alignSelf: 'flex-end',
    margin: space.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: { padding: space.lg, paddingTop: 0, maxWidth: 520, width: '100%', alignSelf: 'center' },
});
