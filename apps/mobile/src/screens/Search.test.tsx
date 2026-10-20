import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import Search from '../../app/search';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn(), canGoBack: () => true },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));

describe('Search (demo)', () => {
  beforeEach(() => {
    useSession.getState().reset();
    useSession
      .getState()
      .completeOnboarding({ username: 'fil_dm7', homeCity: 'lisbon', explorerStyles: ['art'] });
  });

  it('finds you by name, with or without @, and opens your profile', async () => {
    await render(<Search />, { wrapper: queryWrapper() });
    await fireEvent.changeText(screen.getByLabelText(/Search/i), '@FIL_dm');
    expect(screen.getByText('fil_dm7')).toBeOnTheScreen();
    expect(screen.getByText('You')).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('fil_dm7'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/profile');
  });

  it('finds other explorers ignoring case and explains what the demo can find', async () => {
    await render(<Search />, { wrapper: queryWrapper() });
    expect(screen.getByTestId('search-demo-note')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText(/Search/i), 'INES');
    expect(screen.getByText('ines.wanders')).toBeOnTheScreen();
  });
});
