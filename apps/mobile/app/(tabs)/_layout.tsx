import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlightOverlay } from '@/components/FlightOverlay';
import { useArrival } from '@/data/arrival';
import { t } from '@/i18n';
import { isDemo } from '@/lib/env';
import { useLocation } from '@/lib/useLocation';
import { useSession } from '@/state/session';
import { useHydrated } from '@/state/useHydrated';
import { useColors } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export default function TabsLayout() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const onboarded = useSession((s) => s.onboarded);
  const hydrated = useHydrated();
  const loc = useLocation();
  // Opening the app in a new city (after a flight) plays the arrival animation.
  useArrival(loc.position, hydrated && onboarded && (isDemo || loc.isReal));
  if (hydrated && !onboarded) return <Redirect href="/welcome" />;

  const icon = (name: IconName) =>
    function TabIcon({ color, size }: { color: ColorValue; size: number }) {
      return <Ionicons name={name} color={color as string} size={Math.min(size, 24)} />;
    };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.accent,
          tabBarInactiveTintColor: c.textMuted,
          tabBarStyle: {
            backgroundColor: c.card,
            borderTopColor: c.border,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
          },
          // The default label box is shorter than the text, which clipped descenders.
          tabBarLabelStyle: {
            fontSize: 11,
            lineHeight: 15,
            // Medium weight: bolder strokes run together at this size and truncate "Collections".
            fontWeight: '500',
            marginTop: 2,
          },
          sceneStyle: { backgroundColor: c.bg },
        }}
      >
        <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: icon('home') }} />
        <Tabs.Screen
          name="explore"
          options={{ title: t('tabs.explore'), tabBarIcon: icon('map') }}
        />
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
      <FlightOverlay />
    </View>
  );
}
