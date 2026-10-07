import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CategoryPage from '../../app/discover/[category]';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({ category: 'coast' }),
  Redirect: () => null,
}));

jest.mock('@/lib/useLocation', () => ({
  useLocation: () => ({
    position: { lat: 38.7976, lng: -9.3905 },
    accuracy: null,
    isReal: false,
    permission: 'granted',
    request: async () => {},
  }),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 47, left: 0, right: 0, bottom: 34 },
    }}
  >
    <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
  </SafeAreaProvider>
);

describe('Category page', () => {
  it('shows the coast overview, its places and things to learn', async () => {
    await render(<CategoryPage />, { wrapper });
    expect(await screen.findByRole('header', { name: 'Beaches & coast' })).toBeOnTheScreen();
    expect(screen.getByText(/Salt air, the sound of the waves/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('tab', { name: 'Places' }));
    expect(screen.getByRole('button', { name: /^Adraga Beach/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Cabo da Roca/ })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Pena Palace/ })).toBeNull();

    await fireEvent.press(screen.getByRole('tab', { name: 'Learn' }));
    expect(screen.getByText(/explore rock pools/)).toBeOnTheScreen();
    expect(screen.getByText(/Check the tide/)).toBeOnTheScreen();

    // The bottom call to action (the hero also has a map button).
    await fireEvent.press(screen.getAllByRole('button', { name: 'See on the map' }).at(-1)!);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/explore',
      params: { category: 'coast' },
    });
  });
});
