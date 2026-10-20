import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthSession } from '@/lib/auth';
import { isDemo } from '@/lib/env';
import { useSession } from '@/state/session';
import { useHydrated } from '@/state/useHydrated';

export default function Index() {
  const onboarded = useSession((s) => s.onboarded);
  const signedIn = useSession((s) => s.signedIn);
  const hasDemoLogin = useSession((s) => !!s.account);
  const hydrated = useHydrated();
  const { session, loading } = useAuthSession();

  if (!hydrated || loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  const loggedIn = isDemo ? signedIn : !!session;
  if (loggedIn && onboarded) return <Redirect href="/(tabs)" />;
  // Signed in to the server but sign-up isn't finished: pick a username and style.
  if (loggedIn) return <Redirect href="/register" />;
  // Logged out with an explorer to come back to: straight to the login.
  if (hasDemoLogin || (!isDemo && onboarded)) return <Redirect href="/login" />;
  return <Redirect href="/welcome" />;
}
