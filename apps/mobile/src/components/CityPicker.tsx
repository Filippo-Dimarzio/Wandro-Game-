import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEMO_PLACES, REGIONS, type Region } from '@wandro/shared';
import { t } from '@/i18n';
import { isDemo } from '@/lib/env';
import { radius, space, useColors } from '@/theme';

const DEMO_COUNTS = DEMO_PLACES.reduce<Record<string, number>>((acc, p) => {
  if (p.region && !p.hidden) acc[p.region] = (acc[p.region] ?? 0) + 1;
  return acc;
}, {});

/** "Explore Europe": jump the map to a launch city. */
export function CityPicker({
  visible,
  current,
  onPick,
  onClose,
}: {
  visible: boolean;
  current: string | null;
  onPick: (region: Region) => void;
  onClose: () => void;
}) {
  const c = useColors();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        style={styles.scrim}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}
      />
      <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: c.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
            🌍 {t('travel.title')}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color={c.text} />
          </Pressable>
        </View>
        <Text style={{ color: c.textMuted, paddingHorizontal: space.lg }}>
          {isDemo ? t('travel.demoHint') : t('travel.realHint')}
        </Text>
        <ScrollView contentContainerStyle={styles.grid}>
          {REGIONS.map((r) => {
            const selected = current === r.slug;
            return (
              <Pressable
                key={r.slug}
                onPress={() => onPick(r)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${r.name}, ${r.country}`}
                style={[
                  styles.city,
                  {
                    backgroundColor: selected ? c.accentSoft : c.surface,
                    borderColor: selected ? c.accent : 'transparent',
                  },
                ]}
                testID={`city-${r.slug}`}
              >
                <Text style={{ fontSize: 28 }} accessible={false}>
                  {r.flag}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontWeight: '800' }}>{r.name}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 12 }}>
                    {r.country}
                    {isDemo && DEMO_COUNTS[r.slug]
                      ? ` · ${t('travel.placeCount', { count: DEMO_COUNTS[r.slug] })}`
                      : ''}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: space.lg,
    gap: space.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
  title: { fontSize: 22, fontWeight: '900' },
  grid: {
    padding: space.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  city: {
    flexGrow: 1,
    flexBasis: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    padding: space.md,
    minHeight: 56,
  },
});
