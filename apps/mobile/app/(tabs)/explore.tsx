import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CATEGORIES,
  formatDistance,
  haversineMeters,
  NEARBY_NUDGE_M,
  regionFor,
  type Category,
  type LatLng,
  type Place,
  type Region,
} from '@wandro/shared';
import { CategoryChips } from '@/components/CategoryChips';
import { ChallengeSidebar, SIDEBAR_WIDTH } from '@/components/ChallengeSidebar';
import { CityPicker } from '@/components/CityPicker';
import { PlaceSheet } from '@/components/PlaceSheet';
import { ProximityHud } from '@/components/ProximityHud';
import { WalkPad } from '@/components/WalkPad';
import { nearestLocked } from '@/data/discovery';
import { useFriendChallenges, type FriendChallengeView } from '@/data/friends';
import { useHiddenGems } from '@/data/hidden';
import { useLoadout } from '@/data/loadout';
import { useMyExplorer } from '@/data/explorer';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { t } from '@/i18n';
import { isDemo } from '@/lib/env';
import { useLocation } from '@/lib/useLocation';
import { useWalkControls } from '@/lib/walk';
import { MapKey } from '@/components/MapKey';
import { MapAmbience } from '@/map/MapAmbience';
import { PlaceMap } from '@/map/PlaceMap';
import { useChallengeIntro } from '@/state/challengeIntro';
import { useSession } from '@/state/session';
import { radius, shadow, space, useColors } from '@/theme';

export default function Explore() {
  const c = useColors();
  const params = useLocalSearchParams<{
    place?: string;
    category?: string;
    at?: string;
    guide?: string;
    open?: string;
  }>();
  const loc = useLocation();
  const { width } = useWindowDimensions();
  // Tablets and desktop keep the adventures panel open beside the map; phones slide it out.
  const docked = width >= 900;
  const browse = useSession((s) => s.browse);
  const setBrowse = useSession((s) => s.setBrowse);
  const justRevealed = useSession((s) => s.justRevealed);
  const clearJustRevealed = useSession((s) => s.clearJustRevealed);
  const mapCenter = browse ?? loc.position;
  const places = usePlaces(mapCenter);
  const hidden = useHiddenGems(loc.position, isDemo || loc.isReal);
  const region = regionFor(mapCenter);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [focus, setFocus] = useState<LatLng | null>(null);
  const [pendingSelect, setPendingSelect] = useState<string | null>(null);
  const pendingFriendChallenges = useFriendChallenges().filter(
    (x) => x.direction === 'incoming' && x.status === 'pending',
  ).length;
  const panelWidth = Math.min(SIDEBAR_WIDTH, width * 0.88);
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(slide, {
      toValue: sidebarOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [sidebarOpen, slide]);
  const { ids } = useUnlockedIds();
  const showIntro = useChallengeIntro((s) => s.show);
  const loadout = useLoadout();
  const explorer = useMyExplorer();
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

  // From an interest story on Home: show only that interest's challenges.
  useEffect(() => {
    if (params.category && CATEGORIES.includes(params.category as Category))
      setCategory(params.category as Category);
  }, [params.category, params.at]);

  // A place opened from elsewhere, once per tap, as soon as it has loaded. From its challenge
  // card, "Let's go!" sends `guide` (guide the player there) and "Read more" sends `open=sheet`;
  // any other link to a challenge you haven't done opens its card first.
  const opened = useRef<string | null>(null);
  useEffect(() => {
    if (!params.place) return;
    const key = `${params.place}:${params.at ?? ''}:${params.guide ?? ''}:${params.open ?? ''}`;
    if (opened.current === key) return;
    const p = all.find((x) => x.id === params.place);
    if (!p) return;
    opened.current = key;
    if (params.guide === '1' && !ids.has(p.id)) {
      setFocus({ lat: p.lat, lng: p.lng });
      startGuide(p);
    } else if (params.open === 'sheet' || ids.has(p.id)) selectPlace(p);
    else {
      setFocus({ lat: p.lat, lng: p.lng });
      showIntro(p);
    }
    // startGuide/selectPlace only read state; re-running on their identity would re-open the place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.place, params.at, params.guide, params.open, all]);

  // A place picked from another city opens once that city's places have loaded.
  useEffect(() => {
    if (!pendingSelect) return;
    const p = all.find((x) => x.id === pendingSelect);
    if (p) {
      setSelected(p);
      setPendingSelect(null);
    }
  }, [pendingSelect, all]);

  // After an arrival flight, fly the map from the old city to where the player landed.
  const landedAt = useSession((s) => s.landedAt);
  useEffect(() => {
    if (!landedAt) return;
    setBrowse(null);
    setFocus({ ...loc.position });
    // Only when a flight lands, not on every GPS update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landedAt]);

  const revealedPlace = justRevealed ? all.find((p) => p.id === justRevealed) : undefined;
  useEffect(() => {
    if (!justRevealed) return;
    const timer = setTimeout(clearJustRevealed, 8000);
    return () => clearTimeout(timer);
  }, [justRevealed, clearJustRevealed]);

  const pickCity = (r: Region) => {
    setPickerOpen(false);
    setSidebarOpen(false);
    setSelected(null);
    setGuideTo(null);
    if (isDemo) {
      // Demo: you travel there, so walking and check-ins work in the new city.
      setTeleport(r.center);
      setBrowse(null);
    } else {
      setBrowse(r.center);
    }
    setFocus({ ...r.center });
  };

  const backToMe = () => {
    setBrowse(null);
    setFocus(null);
    setRecenter((n) => n + 1);
  };

  /** Tapping a challenge you haven't done opens its card first; found places open their sheet. */
  const tapPlace = (p: Place) => {
    if (ids.has(p.id)) return selectPlace(p);
    if (!docked) setSidebarOpen(false);
    showIntro(p);
  };

  const selectPlace = (p: Place) => {
    setSelected(p);
    setFocus({ lat: p.lat, lng: p.lng });
    if (!docked) setSidebarOpen(false);
  };

  const showChallenge = (x: FriendChallengeView) => {
    const loaded = all.find((p) => p.id === x.place.id);
    if (loaded) return selectPlace(loaded);
    // Another city: look there, then open the place once it's loaded.
    setBrowse({ lat: x.place.lat, lng: x.place.lng });
    setFocus({ lat: x.place.lat, lng: x.place.lng });
    setPendingSelect(x.place.id);
    if (!docked) setSidebarOpen(false);
  };

  const startGuide = (p: Place) => {
    guideStart.current = haversineMeters(loc.position, p);
    setGuideTo(p);
    setSelected(null);
  };

  const nudge =
    !target && !selected && nearest && !nearest.inRange && nearest.distanceM <= NEARBY_NUDGE_M
      ? nearest
      : null;

  const sidebar = (onClose?: () => void) => (
    <ChallengeSidebar
      places={all}
      unlockedIds={ids}
      position={loc.position}
      region={region}
      hidden={hidden}
      onSelect={tapPlace}
      onShowChallenge={showChallenge}
      onPickCity={() => setPickerOpen(true)}
      onClose={onClose}
    />
  );

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: c.bg }}>
      {docked && (
        <SafeAreaView edges={['top']} style={{ width: SIDEBAR_WIDTH }}>
          {sidebar()}
        </SafeAreaView>
      )}
      <View style={{ flex: 1 }}>
        <PlaceMap
          places={visible}
          unlockedIds={ids}
          userPosition={loc.position}
          accuracyM={loc.accuracy}
          target={target}
          trail={loadout.trailActive && !!target}
          avatar={{ explorer, skin: loadout.skin, hat: loadout.hat }}
          follow={walking}
          onSelect={tapPlace}
          recenterSignal={recenter}
          focus={focus}
          onLongPress={(p) =>
            router.push({ pathname: '/submit', params: { lat: String(p.lat), lng: String(p.lng) } })
          }
        />
        <MapAmbience />

        <SafeAreaView edges={['top']} style={styles.top} pointerEvents="box-none">
          <CategoryChips value={category} onChange={setCategory} />
          <View style={styles.topRow} pointerEvents="box-none">
            <MapKey
              toExplore={visible.filter((p) => !ids.has(p.id)).length}
              discovered={visible.filter((p) => ids.has(p.id)).length}
            />
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
              style={[styles.nudge, { backgroundColor: c.goldSoft }]}
              testID="nearby-nudge"
            >
              <Text style={{ color: c.gold, fontWeight: '800' }}>
                {t('nudge.near', {
                  name: nudge.place.name,
                  distance: formatDistance(nudge.distanceM),
                })}{' '}
                · {t('hud.guide')}
              </Text>
            </Pressable>
          )}
          {revealedPlace && (
            <Pressable
              onPress={() => {
                selectPlace(revealedPlace);
                clearJustRevealed();
              }}
              accessibilityRole="button"
              accessibilityLiveRegion="assertive"
              style={[styles.nudge, { backgroundColor: c.accent }]}
              testID="gem-revealed"
            >
              <Text style={{ color: c.accentOn, fontWeight: '800' }}>
                💎 {t('hidden.found', { name: revealedPlace.name })}
              </Text>
            </Pressable>
          )}
          {browse && (
            <Pressable
              onPress={backToMe}
              accessibilityRole="button"
              style={[styles.nudge, { backgroundColor: c.card }]}
              testID="back-to-me"
            >
              <Text style={{ color: c.text, fontWeight: '700' }}>
                🌍 {t('travel.browsing', { city: region?.name ?? '…' })} ·{' '}
                <Text style={{ color: c.accent, fontWeight: '800' }}>{t('travel.backToMe')}</Text>
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
          onPress={backToMe}
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
            others={all}
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

        {!docked && !selected && (
          <Pressable
            onPress={() => setSidebarOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('sidebar.open')}
            accessibilityState={{ expanded: sidebarOpen }}
            style={[styles.edgeTab, { backgroundColor: c.accent }]}
            testID="open-sidebar"
          >
            <Ionicons name="compass" size={22} color={c.accentOn} />
            <Ionicons name="chevron-forward" size={16} color={c.accentOn} />
            {hidden.count + pendingFriendChallenges > 0 && (
              <View style={[styles.edgeBadge, { backgroundColor: c.gold }]}>
                <Text style={styles.edgeBadgeText}>{hidden.count + pendingFriendChallenges}</Text>
              </View>
            )}
          </Pressable>
        )}
      </View>

      {!docked && (
        <>
          <Animated.View
            pointerEvents={sidebarOpen ? 'auto' : 'none'}
            style={[StyleSheet.absoluteFill, styles.scrim, { opacity: slide }]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setSidebarOpen(false)}
              accessibilityRole="button"
              accessibilityLabel={t('sidebar.close')}
            />
          </Animated.View>
          <Animated.View
            pointerEvents={sidebarOpen ? 'auto' : 'none'}
            accessibilityElementsHidden={!sidebarOpen}
            importantForAccessibility={sidebarOpen ? 'auto' : 'no-hide-descendants'}
            style={[
              styles.drawer,
              {
                width: panelWidth,
                transform: [
                  {
                    translateX: slide.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-panelWidth - 16, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
              {sidebar(() => setSidebarOpen(false))}
            </SafeAreaView>
          </Animated.View>
        </>
      )}

      <CityPicker
        visible={pickerOpen}
        current={region?.slug ?? null}
        onPick={pickCity}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  edgeTab: {
    position: 'absolute',
    left: 0,
    top: '42%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 6,
    minHeight: 56,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    ...shadow,
  },
  edgeBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  edgeBadgeText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  scrim: { backgroundColor: 'rgba(0,0,0,0.3)' },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    ...shadow,
    shadowOpacity: 0.25,
  },
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
