import { FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { haversineMeters } from '@wandro/shared';
import { GameBackdrop } from '@/components/GameBackdrop';
import { PlaceCard } from '@/components/PlaceBits';
import { ScreenHeader } from '@/components/ScreenHeader';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { t } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { column, space, useColors } from '@/theme';
import { useChallengeIntro } from '@/state/challengeIntro';

/** Every place still to discover near you, closest first (Home shows the first few). */
export default function Nearby() {
  const c = useColors();
  const loc = useLocation();
  const showIntro = useChallengeIntro((st) => st.show);
  const places = usePlaces(loc.position).data ?? [];
  const { ids } = useUnlockedIds();
  const rows = places
    .filter((p) => !ids.has(p.id))
    .map((p) => ({ p, d: haversineMeters(loc.position, p) }))
    .sort((a, b) => a.d - b.d);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <GameBackdrop />
      <ScreenHeader title={t('home.nearYou')} />
      <FlatList
        data={rows}
        keyExtractor={({ p }) => p.id}
        contentContainerStyle={[styles.list, column]}
        renderItem={({ item: { p, d }, index }) => (
          <PlaceCard
            index={index}
            place={p}
            distanceM={d}
            unlocked={false}
            onPress={() => showIntro(p)}
          />
        )}
        ListEmptyComponent={
          <Text style={{ color: c.textMuted, textAlign: 'center' }}>{t('nearby.empty')}</Text>
        }
        testID="nearby-list"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, gap: space.md },
});
