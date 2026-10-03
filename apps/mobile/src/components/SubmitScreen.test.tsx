import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import Submit from '../../app/submit';
import { useSession } from '@/state/session';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({ lat: '38.79', lng: '-9.39' }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe('Suggest a place', () => {
  beforeEach(() => useSession.getState().reset());

  it('requires a name and the safety checklist before sending', async () => {
    await render(<Submit />, { wrapper });
    const send = screen.getByTestId('submit-send');
    expect(send).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('submit-name'), 'Secret bench');
    expect(send).toBeDisabled();
    await fireEvent.press(screen.getByTestId('check-public'));
    await fireEvent.press(screen.getByTestId('check-safe'));
    expect(screen.getByTestId('submit-send')).toBeEnabled();
    await fireEvent.press(screen.getByTestId('submit-send'));
    expect(useSession.getState().submissions[0]).toMatchObject({
      name: 'Secret bench',
      status: 'pending',
      lat: 38.79,
      lng: -9.39,
    });
  });
});
