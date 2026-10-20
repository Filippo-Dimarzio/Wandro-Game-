import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import AddLogin from '../../app/add-login';
import { verifyPassword } from '@/lib/password';
import { useSession } from '@/state/session';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn(), canGoBack: () => true },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/lib/passwordManager', () => ({ offerToSavePassword: jest.fn(async () => undefined) }));

describe('Add a login to an existing explorer', () => {
  it('keeps the progress and saves only a hash of the password', async () => {
    useSession.getState().reset();
    useSession
      .getState()
      .completeOnboarding({ username: 'fil_dm7', homeCity: 'Lisbon', explorerStyles: ['art'] });
    await render(<AddLogin />);
    await fireEvent.changeText(screen.getByTestId('email'), 'fil@example.com');
    await fireEvent.changeText(screen.getByTestId('password'), 'pena-palace-22');
    await fireEvent.press(screen.getByTestId('submit-login'));
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    const s = useSession.getState();
    expect(s.profile?.username).toBe('fil_dm7');
    expect(s.signedIn).toBe(true);
    expect(s.account?.email).toBe('fil@example.com');
    expect(await verifyPassword('pena-palace-22', s.account!)).toBe(true);
  });
});
