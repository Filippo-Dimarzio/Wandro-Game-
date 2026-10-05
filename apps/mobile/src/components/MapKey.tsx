import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '@/i18n';
import { radius, shadow, space, useColors } from '@/theme';

/**
 * The map's key: how many places are still to explore and how many you've discovered. Tap it to
 * read what the two mean.
 */
export function MapKey({ toExplore, discovered }: { toExplore: number; discovered: number }) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: space.xs, flexShrink: 1 }}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${t('map.toExplore')} ${toExplore}, ${t('map.discovered')} ${discovered}`}
        style={[styles.pill, shadow, { backgroundColor: c.card }]}
        testID="map-key"
      >
        <View style={[styles.badge, { backgroundColor: '#1A2238' }]}>
          <Ionicons name="lock-closed" size={11} color="#fff" />
        </View>
        <Text style={{ color: c.text, fontWeight: '700' }}>
          {t('map.toExplore')} {toExplore}
        </Text>
        <View style={[styles.badge, { backgroundColor: '#F2B705' }]}>
          <Ionicons name="checkmark" size={12} color="#fff" />
        </View>
        <Text style={{ color: c.text, fontWeight: '700' }}>
          {t('map.discovered')} {discovered}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'information-circle-outline'}
          size={16}
          color={c.textMuted}
        />
      </Pressable>
      {open && (
        <View style={[styles.card, shadow, { backgroundColor: c.card }]} testID="map-key-help">
          <Text style={{ color: c.text }}>
            <Text style={{ fontWeight: '800' }}>🔒 {t('map.toExplore')}: </Text>
            {t('map.toExploreHelp')}
          </Text>
          <Text style={{ color: c.text }}>
            <Text style={{ fontWeight: '800' }}>✅ {t('map.discovered')}: </Text>
            {t('map.discoveredHelp')}
          </Text>
          <Text style={{ color: c.textMuted }}>⭐ {t('map.landmarkHelp')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    minHeight: 40,
    alignSelf: 'flex-start',
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { borderRadius: radius.md, padding: space.md, gap: space.sm, maxWidth: 320 },
});
