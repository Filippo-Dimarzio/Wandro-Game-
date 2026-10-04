import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import type { Region } from '@wandro/shared';
import { CITY_ART } from '@/cityArt';
import { t } from '@/i18n';

const PAPER = '#FBF7EE';
const INK = '#1F2A44';
/** Gold stamp ink (shop): a metallic postmark and frame. */
const GOLD_INK = '#A8740A';
const RATIO = 1.22;

/**
 * Positions of the perforation teeth along one edge. The teeth are paper-coloured circles
 * sitting on the edge, so the scalloped outline reads as a postage stamp on any background
 * (a photo, a passport page, a sheet) without needing to know what's behind it.
 */
export function perforations(length: number, radius: number): number[] {
  const count = Math.max(3, Math.floor(length / (radius * 2.6)));
  return Array.from({ length: count }, (_, i) => ((i + 0.5) * length) / count);
}

function Teeth({ width, height, r }: { width: number; height: number; r: number }) {
  const dot = { width: r * 2, height: r * 2, borderRadius: r, backgroundColor: PAPER };
  return (
    <>
      {perforations(width, r).map((x) => (
        <View key={`t${x}`} style={[styles.tooth, dot, { left: x - r, top: -r }]} />
      ))}
      {perforations(width, r).map((x) => (
        <View key={`b${x}`} style={[styles.tooth, dot, { left: x - r, top: height - r }]} />
      ))}
      {perforations(height, r).map((y) => (
        <View key={`l${y}`} style={[styles.tooth, dot, { left: -r, top: y - r }]} />
      ))}
      {perforations(height, r).map((y) => (
        <View key={`r${y}`} style={[styles.tooth, dot, { left: width - r, top: y - r }]} />
      ))}
    </>
  );
}

const native = Platform.OS !== 'web';

/**
 * The stamp you collect for a city: its landmark on a perforated paper stamp, cancelled with
 * a Wandro postmark. `value` is printed where a stamp shows its price (places found there).
 */
export function PostageStamp({
  region,
  value,
  width = 120,
  tilt = 0,
  animate = false,
  gold = false,
  testID,
}: {
  region: Region;
  value?: number;
  /** Collected with gold stamp ink. */
  gold?: boolean;
  width?: number;
  tilt?: number;
  /** Lands with a "thunk", as if just stamped. */
  animate?: boolean;
  testID?: string;
}) {
  const height = Math.round(width * RATIO);
  const r = Math.max(2.5, width * 0.04);
  const pad = r * 2;
  const art = CITY_ART[region.slug];
  const land = useRef(new Animated.Value(animate ? 0 : 1)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.timing(land, {
      toValue: 1,
      duration: 380,
      delay: 120,
      easing: Easing.out(Easing.back(2)),
      useNativeDriver: native,
    }).start();
  }, [animate, land]);

  const small = width < 90;
  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t(gold ? 'stamp.goldLabel' : 'stamp.label', { city: region.name })}
      testID={testID}
      style={[
        styles.shadow,
        { width, height, margin: r },
        {
          opacity: land,
          transform: [
            { rotate: `${tilt}deg` },
            { scale: land.interpolate({ inputRange: [0, 1], outputRange: [1.5, 1] }) },
          ],
        },
      ]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: PAPER }]} />
      <Teeth width={width} height={height} r={r} />
      <View
        style={[
          styles.face,
          { margin: pad },
          gold && { borderWidth: Math.max(1.5, width * 0.02), borderColor: GOLD_INK, padding: 2 },
        ]}
      >
        <View style={styles.art}>
          {art && (
            <Image
              source={art.found}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessible={false}
            />
          )}
          {!!value && (
            <Text style={[styles.value, { fontSize: Math.max(9, width * 0.12) }]}>{value}</Text>
          )}
        </View>
        {!small && (
          <View style={{ alignItems: 'center', paddingTop: 3 }}>
            <Text style={[styles.country, { fontSize: width * 0.055 }]} numberOfLines={1}>
              {t('stamp.country')}
            </Text>
            <Text style={[styles.city, { fontSize: width * 0.1 }]} numberOfLines={1}>
              {region.name}
            </Text>
          </View>
        )}
      </View>
      <Postmark size={width * 0.52} name={region.name} small={small} ink={gold ? GOLD_INK : INK} />
    </Animated.View>
  );
}

/** Round cancellation ink over the stamp's top corner, with wavy-ish bars beside it. */
function Postmark({
  size,
  name,
  small,
  ink,
}: {
  size: number;
  name: string;
  small: boolean;
  ink: string;
}) {
  const gold = ink === GOLD_INK;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.postmarkWrap,
        { top: size * 0.05, right: -size * 0.28, opacity: gold ? 0.9 : 0.6 },
      ]}
      testID={gold ? 'gold-postmark' : undefined}
    >
      <View style={styles.bars}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.bar, { width: size * 0.55, backgroundColor: ink }]} />
        ))}
      </View>
      <View
        style={[
          styles.postmark,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: small ? 1 : gold ? 2 : 1.5,
            borderColor: ink,
          },
        ]}
      >
        {!small && (
          <>
            <Text
              style={[styles.postmarkText, { fontSize: size * 0.13, color: ink }]}
              numberOfLines={1}
            >
              {name.toUpperCase()}
            </Text>
            <View style={[styles.postmarkRule, { width: size * 0.7, backgroundColor: ink }]} />
            <Text style={[styles.postmarkText, { fontSize: size * 0.11, color: ink }]}>
              {gold ? '★ WANDRO ★' : 'WANDRO'}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

/** An empty, dashed space on the passport page for a city you haven't collected yet. */
export function StampSlot({
  region,
  width = 120,
  testID,
}: {
  region: Region;
  width?: number;
  testID?: string;
}) {
  const r = Math.max(2.5, width * 0.04);
  return (
    <View
      accessible
      accessibilityLabel={t('stamp.missing', { city: region.name })}
      testID={testID}
      style={[styles.slot, { width, height: Math.round(width * RATIO), margin: r }]}
    >
      <Ionicons name="lock-closed" size={Math.max(14, width * 0.16)} color={INK} />
      <Text style={styles.slotText} numberOfLines={2}>
        {region.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tooth: { position: 'absolute' },
  face: { flex: 1 },
  art: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(31,42,68,0.4)',
    backgroundColor: '#D9D2C3',
  },
  value: {
    position: 'absolute',
    left: 3,
    top: 1,
    color: '#fff',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 3,
  },
  country: { color: INK, fontWeight: '800', letterSpacing: 1.5 },
  city: {
    color: INK,
    fontWeight: '900',
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
  },
  postmarkWrap: { position: 'absolute', flexDirection: 'row', alignItems: 'center', opacity: 0.6 },
  bars: { gap: 3, marginRight: -2 },
  bar: { height: 1.5, backgroundColor: INK, borderRadius: 1 },
  postmark: {
    borderColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-14deg' }],
  },
  postmarkText: { color: INK, fontWeight: '900', letterSpacing: 0.8 },
  postmarkRule: { height: 1, backgroundColor: INK, marginVertical: 1 },
  slot: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(31,42,68,0.35)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 6,
  },
  slotText: { color: INK, fontWeight: '800', fontSize: 12, textAlign: 'center' },
});
