import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Category, Place } from '@wandro/shared';
import { CategoryChips } from '@/components/CategoryChips';
import { PlaceSheet } from '@/components/PlaceSheet';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { t } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { PlaceMap } from '@/map/PlaceMap';
import { useSession } from '@/state/session';
import { radius, space, useColors } from '@/theme';

export default function Explore() {
  const c = useColors();
  const params = useLocalSearchParams<{ place?: string }>();
  const loc = useLocation();
  const places = usePlaces(loc.position);
  const { ids } = useUnlockedIds();
  const setTeleport = useSession((s) => s.setTeleport);
  const [category, setCategory] = useState<Category | null>(null);
  const [selected, setSelected] = useState<Place | null>(null);
  const [recenter, setRecenter] = useState(0);

  const visible = useMemo(
    () => (places.data ?? []).filter((p) => !category || p.category === category),
    [places.data, category],
  );

  useEffect(() => {
    if (params.place) setSelected((places.data ?? []).find((p) => p.id === params.place) ?? null);
  }, [params.place, places.data]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PlaceMap
        places={visible}
        onLongPress={(p) =>
          router.push({ pathname: '/submit', params: { lat: String(p.lat), lng: String(p.lng) } })
        }
        unlockedIds={ids}
        userPosition={loc.position}
        onSelect={setSelected}
        recenterSignal={recenter}
      />

      <SafeAreaView edges={['top']} style={styles.top} pointerEvents="box-none">
        <CategoryChips value={category} onChange={setCategory} />
        <View style={[styles.legend, { backgroundColor: c.card }]}>
          <View style={[styles.dot, { backgroundColor: c.locked }]} />
          <Text style={{ color: c.text }}>{t('explore.locked')}</Text>
          <View style={[styles.dot, { backgroundColor: c.accent }]} />
          <Text style={{ color: c.text }}>{t('explore.unlocked')}</Text>
          <Text style={{ color: c.textMuted }}>· {visible.length}</Text>
        </View>
      </SafeAreaView>

      {!selected && (
        <Pressable
          onPress={() => router.push('/submit')}
          accessibilityRole="button"
          accessibilityHint={t('submit.longPress')}
          style={[styles.suggest, { backgroundColor: c.card }]}
          testID="suggest-place"
        >
          <Ionicons name="add-circle" size={20} color={c.accent} />
          <Text style={{ color: c.text, fontWeight: '700' }}>{t('submit.button')}</Text>
        </Pressable>
      )}
      <Pressable
        onPress={() => setRecenter((n) => n + 1)}
        accessibilityRole="button"
        accessibilityLabel={t('explore.recenter')}
        style={[styles.fab, { backgroundColor: c.card, bottom: selected ? 300 : space.xl }]}
      >
        <Ionicons name="locate" size={22} color={c.accent} />
      </Pressable>

      {selected && (
        <PlaceSheet
          place={selected}
          userPosition={loc.position}
          unlocked={ids.has(selected.id)}
          onClose={() => setSelected(null)}
          onTeleport={() => {
            setTeleport({ lat: selected.lat, lng: selected.lng });
            setRecenter((n) => n + 1);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0 },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginLeft: space.lg,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  suggest: {
    position: 'absolute',
    left: space.lg,
    bottom: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    minHeight: 44,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fab: {
    position: 'absolute',
    right: space.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});
