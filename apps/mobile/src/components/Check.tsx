import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { space, useColors } from '@/theme';

export function Check({
  label,
  value,
  onChange,
  testID,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  testID?: string;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      style={styles.check}
      testID={testID}
    >
      <Ionicons
        name={value ? 'checkbox' : 'square-outline'}
        size={24}
        color={value ? c.accent : c.textMuted}
      />
      <Text style={{ color: c.text, flex: 1 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  check: { flexDirection: 'row', gap: space.sm, alignItems: 'center', minHeight: 44 },
});
