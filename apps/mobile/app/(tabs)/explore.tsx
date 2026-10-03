import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  formatDistance,
  haversineMeters,
  NEARBY_NUDGE_M,
  type Category,
  type Place,
} from '@wandro/shared';
import { CategoryChips } from '@/components/CategoryChips';
import { PlaceSheet } from '@/components/PlaceSheet';
import { ProximityHud } from '@/components/ProximityHud';
import { WalkPad } from '@/components/WalkPad';
import { nearestLocked } from '@/data/discovery';
import { useLoadout } from '@/data/loadout';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { t } from '@/i18n';
import { isDemo } from '@/lib/env';
import { useLocation } from '@/lib/useLocation';
import { useWalkControls } from '@/lib/walk';
import { PlaceMap } from '@/map/PlaceMap';
import { useSession } from '@/state/session';
import { radius, space, useColors } from '@/theme';

export default function Explore() {
  const c = useColors();
  const params = useLocalSearchParams<{ place?: string }>();
  const loc = useLocation();
  const places = usePlaces(loc.position);
  const { ids } = useUnlockedIds();
  const loadout = useLoadout();
  const setTeleport = useSession((s) => s.setTeleport);
  const [category, setCategory] = useState<Category | null>(null);
  const [selected, setSelected] = useState<Place | null>(null);
  const [guideTo, setGuideTo] = useState<Place | null>(null);
  const [walking, setWalking] = useState(false);
  const [recenter, setRecenter] = useState(0);
  const guideStart = useRef(0);
  const walk = useWalkControls(isDemo && walking, loc.position);

  const all = useMemo(() => places.data ?? [], [places.data]);
  const visible = useMemo(
    () => all.filter((p) => !category || p.category === category),
    [all, category],
  );
  const nearest = nearestLocked(loc.position, loc.accuracy, all, ids);

  // With the incense trail running, guidance always points at the nearest undiscovered place.
  const autoTarget = loadout.trailActive && !guideTo ? (nearest?.place ?? null) : null;
  const target = guideTo && !ids.has(guideTo.id) ? guideTo : autoTarget;
  const targetDistance = target ? haversineMeters(loc.position, target) : 0;
  useEffect(() => {
    if (target) guideStart.current = Math.max(guideStart.current, targetDistance);
    else guideStart.current = 0;
    // Only reset when the target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id]);

  useEffect(() => {
    if (params.place) setSelected(all.find((p) => p.id === params.place) ?? null);
  }, [params.place, all]);

  const startGuide = (p: Place) => {
    guideStart.current = haversineMeters(loc.position, p);
    setGuideTo(p);
    setSelected(null);
  };

  const nudge =
    !target && !selected && nearest && !nearest.inRange && nearest.distanceM <= NEARBY_NUDGE_M
      ? nearest
      : null;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PlaceMap
        places={visible}
        unlockedIds={ids}
        userPosition={loc.position}
        accuracyM={loc.accuracy}
        target={target}
        trail={loadout.trailActive && !!target}
        avatar={{ skin: loadout.skin, hat: loadout.hat }}
        follow={walking}
        onSelect={setSelected}
        recenterSignal={recenter}
        onLongPress={(p) =>
          router.push({ pathname: '/submit', params: { lat: String(p.lat), lng: String(p.lng) } })
        }
      />

      <SafeAreaView edges={['top']} style={styles.top} pointerEvents="box-none">
        <CategoryChips value={category} onChange={setCategory} />
        <View style={styles.topRow} pointerEvents="box-none">
          <View style={[styles.legend, { backgroundColor: c.card }]}>
            <View style={[styles.dot, { backgroundColor: c.locked }]} />
            <Text style={{ color: c.text }}>{t('explore.locked')}</Text>
            <View style={[styles.dot, { backgroundColor: c.accent }]} />
            <Text style={{ color: c.text }}>{t('explore.unlocked')}</Text>
            <Text style={{ color: c.textMuted }}>· {visible.length}</Text>
          </View>
          {isDemo && (
            <Pressable
              onPress={() => {
                if (!walking && !useSession.getState().teleport) setTeleport(loc.position);
                setWalking((w) => !w);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: walking }}
              accessibilityHint={t('walk.hint')}
              style={[styles.walkToggle, { backgroundColor: walking ? c.accent : c.card }]}
              testID="walk-toggle"
            >
              <Text style={{ color: walking ? c.accentOn : c.text, fontWeight: '800' }}>
                🎮 {walking ? t('walk.toggleOff') : t('walk.toggle')}
              </Text>
            </Pressable>
          )}
        </View>
        {walking && Platform.OS === 'web' && (
          <Text style={[styles.hint, { backgroundColor: c.card, color: c.textMuted }]}>
            {t('walk.hint')}
          </Text>
        )}
        {nudge && (
          <Pressable
            onPress={() => startGuide(nudge.place)}
            accessibilityRole="button"
            style={[styles.nudge, { backgroundColor: c.gold }]}
            testID="nearby-nudge"
          >
            <Text style={{ color: '#1C1404', fontWeight: '800' }}>
              {t('nudge.near', {
                name: nudge.place.name,
                distance: formatDistance(nudge.distanceM),
              })}{' '}
              · {t('hud.guide')}
            </Text>
          </Pressable>
        )}
      </SafeAreaView>

      {walking && (
        <View
          style={[styles.pad, { bottom: target ? 230 : space.xl + 56 }]}
          pointerEvents="box-none"
        >
          <WalkPad press={walk.press} release={walk.release} />
        </View>
      )}

      {!selected && !target && (
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
        style={[
          styles.fab,
          { backgroundColor: c.card, bottom: selected ? 300 : target ? 220 : space.xl },
        ]}
      >
        <Ionicons name="locate" size={22} color={c.accent} />
      </Pressable>

      {target && !selected && (
        <ProximityHud
          target={target}
          distanceM={targetDistance}
          startDistanceM={Math.max(guideStart.current, targetDistance)}
          trailActive={loadout.trailActive}
          onDiscover={() => router.push('/(tabs)/capture')}
          onStop={() => setGuideTo(null)}
        />
      )}

      {selected && (
        <PlaceSheet
          place={selected}
          userPosition={loc.position}
          unlocked={ids.has(selected.id)}
          onClose={() => setSelected(null)}
          onGuide={() => startGuide(selected)}
          onTeleport={() => {
            setTeleport({ lat: selected.lat, lng: selected.lng });
            setRecenter((n) => n + 1);
          }}
        />
      )}
    </View>
  );
}

const shadow = {
  elevation: 6,
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
};

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0, gap: space.sm },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  walkToggle: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: 'center',
    ...shadow,
  },
  hint: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    fontSize: 12,
  },
  nudge: {
    alignSelf: 'center',
    marginHorizontal: space.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    ...shadow,
  },
  pad: { position: 'absolute', left: space.lg },
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
    ...shadow,
  },
  fab: {
    position: 'absolute',
    right: space.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
});
