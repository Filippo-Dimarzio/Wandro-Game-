import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '@/i18n';
import type { LocationPermission } from '@/lib/useLocation';
import { radius, shadow, space, useColors } from '@/theme';

/**
 * Asking for location the way other apps do: first a card that says why (your explorer walks
 * with you and guides you to the challenge you picked), then the phone's or browser's own prompt.
 * "Not now" shrinks it to a small chip, and if location was refused it explains how to turn it on.
 */
export function LocationPrompt({
  permission,
  onRequest,
}: {
  permission: LocationPermission;
  onRequest: () => Promise<LocationPermission>;
}) {
  const c = useColors();
  const [later, setLater] = useState(false);
  const [refused, setRefused] = useState(false);
  if (permission === 'granted') return null;

  const ask = () =>
    onRequest().then((p) => {
      if (p !== 'granted') setRefused(true);
    });
  const openSettings = () => {
    if (Platform.OS !== 'web') Linking.openSettings().catch(() => undefined);
  };
  const blocked = permission === 'denied' || refused;

  if (later || blocked)
    return (
      <View style={styles.chipWrap} pointerEvents="box-none">
        <Pressable
          onPress={blocked ? openSettings : ask}
          accessibilityRole="button"
          accessibilityHint={blocked ? t('location.blockedHint') : undefined}
          style={[styles.chip, shadow, { backgroundColor: c.card }]}
          testID="location-chip"
        >
          <Ionicons name="navigate-circle" size={18} color={c.accent} />
          <Text style={{ color: c.text, fontWeight: '800' }}>
            {blocked ? t('location.blocked') : t('location.turnOn')}
          </Text>
        </Pressable>
        {blocked && (
          <Text style={[styles.howto, { color: c.textMuted, backgroundColor: c.card }]}>
            {Platform.OS === 'web' ? t('location.howtoWeb') : t('location.howtoPhone')}
          </Text>
        )}
      </View>
    );

  return (
    <View style={styles.backdrop} pointerEvents="box-none">
      <View
        style={[styles.card, shadow, { backgroundColor: c.card }]}
        accessibilityViewIsModal
        testID="location-prompt"
      >
        <View style={[styles.icon, { backgroundColor: c.accentSoft }]}>
          <Ionicons name="navigate" size={30} color={c.accent} />
        </View>
        <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
          {t('location.title')}
        </Text>
        <Text style={[styles.body, { color: c.textMuted }]}>{t('location.body')}</Text>
        <View style={styles.points}>
          {(['location.point1', 'location.point2', 'location.point3'] as const).map((k) => (
            <View key={k} style={styles.point}>
              <Ionicons name="checkmark-circle" size={18} color={c.accent} />
              <Text style={{ color: c.text, flex: 1 }}>{t(k)}</Text>
            </View>
          ))}
        </View>
        <Pressable
          onPress={ask}
          accessibilityRole="button"
          style={[styles.allow, { backgroundColor: c.accent }]}
          testID="location-allow"
        >
          <Text style={{ color: c.accentOn, fontWeight: '900', fontSize: 16 }}>
            {t('location.allow')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setLater(true)}
          accessibilityRole="button"
          style={styles.later}
          testID="location-later"
        >
          <Text style={{ color: c.textMuted, fontWeight: '800' }}>{t('location.later')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.xl,
    padding: space.xl,
    gap: space.sm,
    alignItems: 'center',
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  body: { textAlign: 'center', lineHeight: 21 },
  points: { alignSelf: 'stretch', gap: 6, marginVertical: space.xs },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  allow: {
    alignSelf: 'stretch',
    borderRadius: radius.pill,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  later: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  chipWrap: { position: 'absolute', top: 120, left: 0, right: 0, alignItems: 'center', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    minHeight: 40,
  },
  howto: {
    maxWidth: 320,
    textAlign: 'center',
    fontSize: 12,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
