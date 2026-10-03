import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  formatDistance,
  haversineMeters,
  pointsForVisit,
  type LatLng,
  type Place,
} from '@wandro/shared';
import { t } from '@/i18n';
import { isDemo } from '@/lib/env';
import { radius, space, useColors } from '@/theme';

interface Props {
  place: Place;
  userPosition: LatLng;
  unlocked: boolean;
  onClose: () => void;
  onTeleport?: () => void;
  /** Start Find-My-style guidance to this place. */
  onGuide?: () => void;
}

export function categoryIcon(cat: Place['category']): keyof typeof Ionicons.glyphMap {
  return (
    {
      culture: 'color-palette',
      heritage: 'business',
      nature: 'leaf',
      music_events: 'musical-notes',
      other: 'compass',
    } as const
  )[cat];
}

/** Google Maps-style sheet: a peek card that expands to full details. */
export function PlaceSheet({ place, userPosition, unlocked, onClose, onTeleport, onGuide }: Props) {
  const c = useColors();
  const [expanded, setExpanded] = useState(false);
  const pts = pointsForVisit(place.category, place.uniqueVisitors, place.basePoints);
  const distance = haversineMeters(userPosition, place);
  const catColor = c.category[place.category];

  const openDirections = () => {
    const q = `${place.lat},${place.lng}`;
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${q}&dirflg=w`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=walking`,
    });
    Linking.openURL(url).catch(() => undefined);
  };

  return (
    <View
      style={[styles.sheet, { backgroundColor: c.card, shadowColor: '#000' }]}
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

      {expanded && (
        <View style={styles.photo}>
          {place.photoUrl ? (
            <Image
              source={{ uri: place.photoUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessibilityLabel={place.name}
            />
          ) : (
            <LinearGradient colors={[catColor, '#0B2A24']} style={StyleSheet.absoluteFill}>
              <View style={styles.photoIcon}>
                <Ionicons
                  name={categoryIcon(place.category)}
                  size={56}
                  color="rgba(255,255,255,0.85)"
                />
              </View>
            </LinearGradient>
          )}
          {!unlocked && (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(230,228,220,0.55)' }]}
            />
          )}
        </View>
      )}

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: c.text }]} accessibilityRole="header">
            {place.name}
          </Text>
          <Text style={{ color: catColor, fontWeight: '700' }}>
            {t(`category.${place.category}`)} ·{' '}
            {t('place.distance', { distance: formatDistance(distance) })}
          </Text>
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
        <View style={[styles.badge, { backgroundColor: unlocked ? c.accent : c.surface }]}>
          <Ionicons
            name={unlocked ? 'lock-open' : 'lock-closed'}
            size={14}
            color={unlocked ? c.accentOn : c.text}
          />
          <Text style={{ color: unlocked ? c.accentOn : c.text, fontWeight: '700' }}>
            {unlocked ? t('place.discovered') : t('place.points', { points: pts.total })}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: c.surface }]}>
          <Text style={{ color: c.text }}>
            {t('place.rarity', { visitors: place.uniqueVisitors })}
          </Text>
        </View>
        {place.uniqueVisitors < 20 && (
          <View style={[styles.badge, { backgroundColor: c.surface }]}>
            <Text style={{ color: c.gold, fontWeight: '700' }}>💎 {t('place.hiddenGem')}</Text>
          </View>
        )}
      </View>

      {expanded && (
        <>
          <Text style={{ color: c.text, lineHeight: 21 }}>{place.description}</Text>
          {pts.firstDiscovererBonus > 0 && !unlocked && (
            <Text style={{ color: c.gold, fontWeight: '700' }}>
              {t('place.firstBonus', { points: pts.firstDiscovererBonus })}
            </Text>
          )}
          {place.photoCredit && (
            <Text style={{ color: c.textMuted, fontSize: 12 }}>Photo: {place.photoCredit}</Text>
          )}
        </>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={openDirections}
          accessibilityRole="button"
          style={[styles.action, { backgroundColor: c.accent }]}
        >
          <Ionicons name="navigate" size={16} color={c.accentOn} />
          <Text style={{ color: c.accentOn, fontWeight: '700' }}>{t('place.directions')}</Text>
        </Pressable>
        {!unlocked && onGuide && (
          <Pressable
            onPress={onGuide}
            accessibilityRole="button"
            style={[styles.action, { backgroundColor: c.gold }]}
            testID="guide-me"
          >
            <Ionicons name="compass" size={16} color="#1C1404" />
            <Text style={{ color: '#1C1404', fontWeight: '800' }}>{t('hud.guide')}</Text>
          </Pressable>
        )}
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
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.lg,
    paddingTop: 0,
    gap: space.md,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handleArea: { alignItems: 'center', paddingVertical: space.sm },
  handle: { width: 44, height: 5, borderRadius: 3 },
  photo: { height: 170, borderRadius: radius.md, overflow: 'hidden' },
  photoIcon: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  actions: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    minHeight: 44,
  },
});
