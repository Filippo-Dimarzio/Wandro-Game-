import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '@/i18n';
import type { Direction } from '@/lib/walk';
import { radius, useColors } from '@/theme';

const ICONS: Record<Direction, keyof typeof Ionicons.glyphMap> = {
  up: 'caret-up',
  down: 'caret-down',
  left: 'caret-back',
  right: 'caret-forward',
};

/** On-screen pad for walking the octopus in demo mode (hold a direction to keep walking). */
export function WalkPad({
  press,
  release,
}: {
  press: (d: Direction) => void;
  release: (d: Direction) => void;
}) {
  const c = useColors();
  const btn = (d: Direction) => (
    <Pressable
      onPressIn={() => press(d)}
      onPressOut={() => release(d)}
      accessibilityRole="button"
      accessibilityLabel={t(`walk.${d}`)}
      style={[styles.btn, { backgroundColor: c.card }]}
      testID={`walk-${d}`}
    >
      <Ionicons name={ICONS[d]} size={22} color={c.accent} />
    </Pressable>
  );
  return (
    <View style={styles.pad} accessibilityLabel={t('walk.pad')}>
      <View style={styles.row}>{btn('up')}</View>
      <View style={styles.row}>
        {btn('left')}
        <View style={[styles.center, { backgroundColor: c.surface }]}>
          <Text style={{ fontSize: 18 }}>🐙</Text>
        </View>
        {btn('right')}
      </View>
      <View style={styles.row}>{btn('down')}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { alignItems: 'center', gap: 4 },
  row: { flexDirection: 'row', gap: 4 },
  btn: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  center: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
