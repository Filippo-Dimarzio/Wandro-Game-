import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { space, useColors } from '@/theme';

/** Simple header with a back button for stacked (non-tab) screens. */
export function ScreenHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={28} color={c.text} />
      </Pressable>
      <Text style={[styles.title, { color: c.text }]} accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
      <View style={{ minWidth: 28 }}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  title: { flex: 1, fontSize: 22, fontWeight: '900' },
});
