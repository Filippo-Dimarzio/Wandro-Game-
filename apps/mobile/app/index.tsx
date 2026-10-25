import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuthSession } from '@/lib/auth';
import { isDemo } from '@/lib/env';
import { useSession } from '@/state/session';
import { useHydrated } from '@/state/useHydrated';

export default function Index() {
  const onboarded = useSession((s) => s.onboarded);
  const signedIn = useSession((s) => s.signedIn);
  const hasDemoLogin = useSession((s) => !!s.account);
  // Demo progress lives in the local ledger; a server player's coins live on the server.
  const hasDemoProgress = useSession((s) => s.ledger.length > 0);
  const retireDemo = useSession((s) => s.retireDemo);
  const demoRetired = useSession((s) => s.demoRetired);
  const hydrated = useHydrated();
  const { session, loading } = useAuthSession();
  // Connected to the server with a demo explorer still on the device: its login can't work there.
  const leftoverDemo =
    !isDemo && hydrated && !loading && !session && (hasDemoLogin || hasDemoProgress);
  useEffect(() => {
    if (leftoverDemo) retireDemo();
  }, [leftoverDemo, retireDemo]);

  if (!hydrated || loading || leftoverDemo) {
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
  if (!isDemo && demoRetired) return <Redirect href="/register" />;
  return <Redirect href="/welcome" />;
}
