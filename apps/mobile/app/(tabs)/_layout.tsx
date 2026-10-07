import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExplorerAvatar } from '@/components/ExplorerAvatar';
import { FlightOverlay } from '@/components/FlightOverlay';
import { useMyExplorer } from '@/data/explorer';
import { useLoadout } from '@/data/loadout';
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
  const explorer = useMyExplorer();
  const loadout = useLoadout();
  // Opening the app in a new city (after a flight) plays the arrival animation.
  useArrival(loc.position, hydrated && onboarded && (isDemo || loc.isReal));
  if (hydrated && !onboarded) return <Redirect href="/welcome" />;

  // Game-style bar: icons only, each in a tile; the active one lifts up and fills in.
  const icon = (name: IconName, active: IconName) =>
    function TabIcon({ focused }: { focused: boolean }) {
      return (
        <View
          style={[
            styles.tile,
            focused
              ? [styles.tileOn, { backgroundColor: c.accent, borderColor: c.gold }]
              : { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <Ionicons
            name={focused ? active : name}
            color={focused ? c.accentOn : c.text}
            size={24}
          />
        </View>
      );
    };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: c.card,
            borderTopColor: c.gold,
            borderTopWidth: 3,
            height: 68 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom,
          },
          sceneStyle: { backgroundColor: c.bg },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.home'),
            tabBarAccessibilityLabel: t('tabs.home'),
            tabBarIcon: icon('home-outline', 'home'),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: t('tabs.explore'),
            tabBarAccessibilityLabel: t('tabs.explore'),
            tabBarIcon: icon('map-outline', 'map'),
          }}
        />
        <Tabs.Screen
          name="capture"
          options={{
            title: t('tabs.capture'),
            tabBarAccessibilityLabel: t('tabs.capture'),
            tabBarIcon: icon('location-outline', 'location'),
          }}
        />
        <Tabs.Screen
          name="collections"
          options={{
            title: t('tabs.collections'),
            tabBarAccessibilityLabel: t('tabs.collections'),
            tabBarIcon: icon('ribbon-outline', 'ribbon'),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabs.profile'),
            tabBarAccessibilityLabel: t('tabs.profile'),
            // Profile is your explorer's own face.
            tabBarIcon: ({ focused }) => (
              <View
                style={[
                  styles.face,
                  { borderColor: focused ? c.gold : c.border },
                  focused && styles.tileOn,
                ]}
              >
                <ExplorerAvatar explorer={explorer} skin={loadout.skin} size={38} />
              </View>
            ),
          }}
        />
      </Tabs>
      <FlightOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 48,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileOn: {
    transform: [{ translateY: -4 }],
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  face: { borderRadius: 24, borderWidth: 3, overflow: 'hidden' },
});
