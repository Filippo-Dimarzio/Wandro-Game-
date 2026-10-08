import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ChallengeIntro } from '@/components/ChallengeIntro';
import { queryClient } from '@/data/queryClient';
import { setupPwa } from '@/lib/pwa';
import { useColors, useIsDark } from '@/theme';

setupPwa();

export default function RootLayout() {
  const c = useColors();
  const dark = useIsDark();
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />
        <ChallengeIntro />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
