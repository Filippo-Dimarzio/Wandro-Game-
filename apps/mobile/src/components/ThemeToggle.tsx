import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { t } from '@/i18n';
import { useSession } from '@/state/session';
import { useColors, useIsDark } from '@/theme';

/** A moon / sun button in the app's header that switches between light and dark mode. */
export function ThemeToggle({ size = 24 }: { size?: number }) {
  const c = useColors();
  const dark = useIsDark();
  const setTheme = useSession((s) => s.setTheme);
  return (
    <Pressable
      onPress={() => setTheme(dark ? 'light' : 'dark')}
      accessibilityRole="switch"
      accessibilityLabel={t('theme.dark')}
      accessibilityState={{ checked: dark }}
      hitSlop={8}
      testID="theme-toggle"
    >
      <Ionicons name={dark ? 'sunny-outline' : 'moon-outline'} size={size} color={c.text} />
    </Pressable>
  );
}
