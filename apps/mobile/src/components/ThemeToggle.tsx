import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { t } from '@/i18n';
import { useSession } from '@/state/session';
import { useColors, useIsDark } from '@/theme';

/** A tab on the right edge of every screen that switches between light and dark mode. */
export function ThemeToggle() {
  const c = useColors();
  const dark = useIsDark();
  const setTheme = useSession((s) => s.setTheme);
  // Out of the way while the full-screen trip animation plays.
  const travelling = useSession((s) => !!s.flight);
  if (travelling) return null;
  return (
    <Pressable
      onPress={() => setTheme(dark ? 'light' : 'dark')}
      accessibilityRole="switch"
      accessibilityLabel={t('theme.dark')}
      accessibilityState={{ checked: dark }}
      hitSlop={{ top: 6, bottom: 6, left: 14, right: 0 }}
      style={[styles.tab, { backgroundColor: c.card, borderColor: c.border, shadowColor: '#000' }]}
      testID="theme-toggle"
    >
      <Ionicons name={dark ? 'sunny' : 'moon'} size={17} color={dark ? '#F6C350' : c.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    position: 'absolute',
    right: 0,
    top: '42%',
    width: 30,
    height: 44,
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderRightWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: -1, height: 2 },
    elevation: 4,
  },
});
