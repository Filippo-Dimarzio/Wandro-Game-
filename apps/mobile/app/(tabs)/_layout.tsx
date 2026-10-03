import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { t } from '@/i18n';
import { useSession } from '@/state/session';
import { useHydrated } from '@/state/useHydrated';
import { useColors } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export default function TabsLayout() {
  const c = useColors();
  const onboarded = useSession((s) => s.onboarded);
  const hydrated = useHydrated();
  if (hydrated && !onboarded) return <Redirect href="/welcome" />;

  const icon = (name: IconName) =>
    function TabIcon({ color, size }: { color: ColorValue; size: number }) {
      return <Ionicons name={name} color={color as string} size={size} />;
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.border },
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: icon('home') }} />
      <Tabs.Screen name="explore" options={{ title: t('tabs.explore'), tabBarIcon: icon('map') }} />
      <Tabs.Screen
        name="capture"
        options={{ title: t('tabs.capture'), tabBarIcon: icon('add-circle') }}
      />
      <Tabs.Screen
        name="collections"
        options={{ title: t('tabs.collections'), tabBarIcon: icon('albums') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile'), tabBarIcon: icon('person-circle') }}
      />
    </Tabs>
  );
}
