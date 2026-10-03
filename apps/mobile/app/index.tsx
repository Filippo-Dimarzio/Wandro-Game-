import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthSession } from '@/lib/auth';
import { isDemo } from '@/lib/env';
import { useSession } from '@/state/session';
import { useHydrated } from '@/state/useHydrated';

export default function Index() {
  const onboarded = useSession((s) => s.onboarded);
  const hydrated = useHydrated();
  const { session, loading } = useAuthSession();

  if (!hydrated || loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!onboarded) return <Redirect href="/welcome" />;
  if (!isDemo && !session) return <Redirect href="/register" />;
  return <Redirect href="/(tabs)" />;
}
