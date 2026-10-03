import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCollections } from '@/data/collections';
import { usePlaces, useUnlockedIds } from '@/data/places';
import { t } from '@/i18n';
import { useLocation } from '@/lib/useLocation';
import { radius, space, useColors } from '@/theme';

export default function Collections() {
  const c = useColors();
  const loc = useLocation();
  const places = usePlaces(loc.position).data ?? [];
  const { ids } = useUnlockedIds();
  const collections = useCollections(places);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">
            {t('collections.title')}
          </Text>
          <Pressable
            onPress={() => router.push('/leaderboard')}
            accessibilityRole="button"
            accessibilityLabel={t('home.leaderboard')}
            hitSlop={8}
          >
            <Ionicons name="trophy-outline" size={24} color={c.text} />
          </Pressable>
        </View>
        {collections.map((col) => {
          const fraction = col.total ? col.done / col.total : 0;
          return (
            <View
              key={col.id}
              style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
              accessible
              accessibilityLabel={`${col.title}, ${t('collections.progress', { done: col.done, total: col.total })}`}
            >
              <LinearGradient colors={col.colors} style={styles.cover}>
                <Text style={styles.coverTitle}>{col.title}</Text>
                <Text style={styles.coverMeta}>
                  {col.completed
                    ? `🏆 ${t('collections.completed')}`
                    : `🪙 ${t('collections.bonus', { coins: col.bonus })}`}
                </Text>
              </LinearGradient>
              <View style={{ padding: space.md, gap: space.sm }}>
                <Text style={{ color: c.textMuted }}>{col.description}</Text>
                <Text style={{ color: c.text, fontWeight: '700' }}>
                  {t('collections.progress', { done: col.done, total: col.total })}
                </Text>
                <View style={[styles.track, { backgroundColor: c.border }]}>
                  <View
                    style={[styles.bar, { width: `${fraction * 100}%`, backgroundColor: c.accent }]}
                  />
                </View>
                {col.placeIds.map((id) => {
                  const p = places.find((x) => x.id === id);
                  if (!p) return null;
                  return (
                    <Pressable
                      key={id}
                      onPress={() =>
                        router.push({ pathname: '/(tabs)/explore', params: { place: id } })
                      }
                      style={styles.item}
                      accessibilityRole="link"
                    >
                      <Ionicons
                        name={ids.has(id) ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={ids.has(id) ? c.accent : c.textMuted}
                      />
                      <Text style={{ color: c.text }}>{p.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900' },
  card: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  cover: { height: 120, padding: space.lg, justifyContent: 'flex-end' },
  coverTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  coverMeta: { color: 'rgba(255,255,255,0.95)', fontWeight: '700' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  bar: { height: 6 },
  item: { flexDirection: 'row', gap: space.sm, alignItems: 'center', minHeight: 32 },
});
