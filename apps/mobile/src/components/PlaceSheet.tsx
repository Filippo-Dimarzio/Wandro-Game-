import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { directionsUrl } from '@/lib/directions';
import {
  formatDistance,
  haversineMeters,
  pointsForVisit,
  type LatLng,
  type Place,
} from '@wandro/shared';
import { placeImage } from '@/categories';
import { PhotoButton } from '@/components/PhotoSheet';
import { t } from '@/i18n';
import { isDemo } from '@/lib/env';
import { scheduleLines } from '@/lib/hours';
import { radius, space, useColors } from '@/theme';
import { CategoryPill, HoursChip } from './PlaceBits';
import { PlaceLearn, PlacePlan } from './PlaceDetailsTabs';
import { TimeQuestBadge } from './TimeQuestBadge';

export { categoryIcon } from '@/categories';

type Tab = 'about' | 'learn' | 'plan';
const TABS: Tab[] = ['about', 'learn', 'plan'];
const TAB_LABEL = {
  about: 'place.tabAbout',
  learn: 'place.tabLearn',
  plan: 'place.tabPlan',
} as const;
const TAB_ICON = {
  about: 'information-circle',
  learn: 'bulb',
  plan: 'map',
} as const;

interface Props {
  place: Place;
  /** Other places on the map, to suggest one to pair with on the Plan tab. */
  others?: Place[];
  userPosition: LatLng;
  unlocked: boolean;
  onClose: () => void;
  onTeleport?: () => void;
  /** Start Find-My-style guidance to this place. */
  onGuide?: () => void;
}

/** Google Maps-style sheet: a peek card that expands to full details, coloured by category. */
export function PlaceSheet({
  place,
  others = [],
  userPosition,
  unlocked,
  onClose,
  onTeleport,
  onGuide,
}: Props) {
  const c = useColors();
  const { height } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>('about');
  const pts = pointsForVisit(place.category, place.uniqueVisitors, place.basePoints);
  const distance = haversineMeters(userPosition, place);
  const catColor = c.category[place.category];
  const schedule = scheduleLines(place.hours);
  const factCount = place.details?.facts.length ?? 0;

  const openDirections = () => {
    Linking.openURL(directionsUrl(place, distance)).catch(() => undefined);
  };

  return (
    <View
      style={[styles.sheet, { backgroundColor: c.card, shadowColor: '#0B3A5E' }]}
      testID="place-sheet"
    >
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        accessibilityRole="button"
        accessibilityLabel={t('place.expand')}
        style={styles.handleArea}
      >
        <View style={[styles.handle, { backgroundColor: c.border }]} />
      </Pressable>

      {/* The photo sits on About only, so Learn and Plan fit on small screens. */}
      {expanded && tab === 'about' && (
        <View style={styles.photo}>
          <Image
            source={placeImage(place)}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            accessibilityLabel={place.photoUrl ? place.name : undefined}
            accessible={!!place.photoUrl}
          />
          {!unlocked && (
            <View style={[styles.lockedTag, { backgroundColor: 'rgba(14,26,36,0.65)' }]}>
              <Ionicons name="lock-closed" size={12} color="#fff" />
              <Text style={styles.lockedText}>{t('place.locked')}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.headerRow}>
        <View style={{ flex: 1, gap: 6 }}>
          <CategoryPill category={place.category} />
          <Text style={[styles.name, { color: c.text }]} accessibilityRole="header">
            {place.name}
          </Text>
          <Text style={{ color: c.textMuted, fontWeight: '600' }}>
            {t('place.distance', { distance: formatDistance(distance) })}
          </Text>
          <HoursChip place={place} />
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('place.close')}
          hitSlop={12}
        >
          <Ionicons name="close-circle" size={30} color={c.textMuted} />
        </Pressable>
      </View>

      <View style={styles.badges}>
        <View
          style={[
            styles.badge,
            { backgroundColor: unlocked ? catColor : c.categoryTint[place.category] },
          ]}
        >
          <Ionicons
            name={unlocked ? 'lock-open' : 'star'}
            size={14}
            color={unlocked ? c.onCategory : catColor}
          />
          <Text style={{ color: unlocked ? c.onCategory : catColor, fontWeight: '800' }}>
            {unlocked ? t('place.discovered') : t('place.points', { points: pts.total })}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: c.surface }]}>
          <Text style={{ color: c.text }}>
            {t('place.rarity', { visitors: place.uniqueVisitors })}
          </Text>
        </View>
        {place.uniqueVisitors < 20 && (
          <View style={[styles.badge, { backgroundColor: c.goldSoft }]}>
            <Text style={{ color: c.gold, fontWeight: '700' }}>💎 {t('place.hiddenGem')}</Text>
          </View>
        )}
      </View>
      {!unlocked && <TimeQuestBadge place={place} />}

      {!expanded && place.details?.teaser && (
        <Text style={{ color: c.text, fontWeight: '700' }} numberOfLines={2} testID="peek-teaser">
          {place.details.teaser}
        </Text>
      )}

      {/* Always visible so the Learn and Plan content is one obvious tap away. */}
      <View style={[styles.tabs, { backgroundColor: c.surface }]} accessibilityRole="tablist">
        {TABS.map((k) => {
          const on = expanded && tab === k;
          const label =
            k === 'learn' && factCount > 0
              ? t('place.tabLearnCount', { count: factCount })
              : t(TAB_LABEL[k]);
          return (
            <Pressable
              key={k}
              onPress={() => {
                if (on) setExpanded(false);
                else {
                  setTab(k);
                  setExpanded(true);
                }
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={
                k === 'learn' && factCount > 0
                  ? t('place.tabLearnA11y', { count: factCount })
                  : undefined
              }
              style={[
                styles.tab,
                on && { backgroundColor: catColor },
                !expanded && k === 'learn' && { borderWidth: 2, borderColor: catColor },
              ]}
              testID={`tab-${k}`}
            >
              <Ionicons name={TAB_ICON[k]} size={16} color={on ? c.onCategory : catColor} />
              <Text style={{ color: on ? c.onCategory : c.text, fontWeight: '800' }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {expanded && tab !== 'about' && (
        <ScrollView style={{ maxHeight: height * 0.4 }} contentContainerStyle={{ gap: space.md }}>
          {tab === 'learn' ? (
            <PlaceLearn place={place} unlocked={unlocked} />
          ) : (
            <PlacePlan place={place} others={others} />
          )}
        </ScrollView>
      )}

      {expanded && tab === 'about' && (
        <ScrollView style={{ maxHeight: height * 0.4 }} contentContainerStyle={{ gap: space.md }}>
          {place.details?.teaser && (
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>
              {place.details.teaser}
            </Text>
          )}
          <Text style={{ color: c.text, lineHeight: 21 }}>{place.description}</Text>
          {schedule.map((line) => (
            <View key={line} style={styles.scheduleRow}>
              <Ionicons name="calendar-outline" size={16} color={catColor} />
              <Text style={{ color: c.text, fontWeight: '600' }}>{line}</Text>
            </View>
          ))}
          {pts.firstDiscovererBonus > 0 && !unlocked && (
            <Text style={{ color: c.gold, fontWeight: '700' }}>
              {t('place.firstBonus', { points: pts.firstDiscovererBonus })}
            </Text>
          )}
          {place.photoCredit && (
            <Text
              style={{ color: c.textMuted, fontSize: 12 }}
              onPress={place.photoSource ? () => Linking.openURL(place.photoSource!) : undefined}
              accessibilityRole={place.photoSource ? 'link' : 'text'}
              testID="photo-credit"
            >
              {t('place.photoCredit', {
                author: place.photoCredit,
                license: place.photoLicense ?? '',
              })}
            </Text>
          )}
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/discover/[category]',
                params: { category: place.category },
              })
            }
            accessibilityRole="link"
            style={styles.learn}
          >
            <Text style={{ color: catColor, fontWeight: '800' }}>
              {t('place.learnMore', { category: t(`category.${place.category}`) })}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={catColor} />
          </Pressable>
        </ScrollView>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={openDirections}
          accessibilityRole="button"
          style={[styles.action, { backgroundColor: catColor }]}
        >
          <Ionicons name="navigate" size={16} color={c.onCategory} />
          <Text style={{ color: c.onCategory, fontWeight: '800' }}>{t('place.directions')}</Text>
        </Pressable>
        {!unlocked && onGuide && (
          <Pressable
            onPress={onGuide}
            accessibilityRole="button"
            style={[styles.action, { backgroundColor: c.goldSoft }]}
            testID="guide-me"
          >
            <Ionicons name="compass" size={16} color={c.gold} />
            <Text style={{ color: c.gold, fontWeight: '800' }}>{t('hud.guide')}</Text>
          </Pressable>
        )}
        <PhotoButton place={place} size={40} />
        {isDemo && onTeleport && (
          <Pressable
            onPress={onTeleport}
            accessibilityRole="button"
            style={[styles.action, { backgroundColor: c.surface }]}
          >
            <Ionicons name="locate" size={16} color={c.text} />
            <Text style={{ color: c.text, fontWeight: '600' }}>{t('place.teleport')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.lg,
    paddingTop: 0,
    gap: space.md,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handleArea: { alignItems: 'center', paddingVertical: space.sm },
  handle: { width: 44, height: 5, borderRadius: 3 },
  photo: { height: 180, borderRadius: radius.lg, overflow: 'hidden' },
  lockedTag: {
    position: 'absolute',
    top: space.sm,
    left: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lockedText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  name: { fontSize: 22, fontWeight: '800' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  tabs: { flexDirection: 'row', borderRadius: radius.pill, padding: 4, gap: 4 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: radius.pill,
  },
  learn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  actions: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    minHeight: 44,
  },
});
