import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import Settings from '../../app/settings';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn(), canGoBack: () => true },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/lib/notifications', () => ({ setDailyReminder: jest.fn(async () => true) }));
jest.mock('@/lib/download', () => ({ saveJson: jest.fn(async () => undefined) }));

const wrapper = queryWrapper();

describe('Settings', () => {
  beforeEach(() => {
    useSession.getState().reset();
    useSession
      .getState()
      .completeOnboarding({ username: 'filippo', homeCity: 'Sintra', explorerStyles: ['nature'] });
  });

  it('only deletes after typing DELETE, then wipes local data', async () => {
    await render(<Settings />, { wrapper });
    expect(screen.getByTestId('delete-account')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('delete-confirm'), 'delete');
    expect(screen.getByTestId('delete-account')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('delete-confirm'), 'DELETE');
    await fireEvent.press(screen.getByTestId('delete-account'));
    expect(useSession.getState().onboarded).toBe(false);
    expect(useSession.getState().profile).toBeNull();
  });

  it('makes the account private', async () => {
    await render(<Settings />, { wrapper });
    await fireEvent(screen.getByTestId('private-switch'), 'valueChange', true);
    expect(useSession.getState().profile?.isPrivate).toBe(true);
  });
});
