import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import Register from '../../app/register';
import { verifyPassword } from '@/lib/password';
import { useSession } from '@/state/session';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn(), canGoBack: () => true },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('@/lib/passwordManager', () => ({ offerToSavePassword: jest.fn(async () => undefined) }));
jest.mock('@/lib/confirm', () => ({ confirmAction: jest.fn(async () => mockConfirm) }));

let mockConfirm = true;

async function createAccount(email: string, password: string) {
  await fireEvent.changeText(screen.getByTestId('email'), email);
  await fireEvent.changeText(screen.getByTestId('password'), password);
  await submitAndSettle();
}

/** Hashing the password takes a moment: wait until the form stops being busy. */
async function submitAndSettle() {
  await fireEvent.press(screen.getByTestId('submit-login'));
  await waitFor(() => expect(screen.queryByText('One moment…')).toBeNull());
}

async function finishProfile(username: string) {
  await fireEvent.changeText(await screen.findByTestId('username'), username);
  await fireEvent.press(screen.getByTestId('profile-next'));
  await fireEvent.press(screen.getByTestId('style-nature'));
  await fireEvent.press(screen.getByTestId('guidelines'));
  await fireEvent.press(screen.getByTestId('finish'));
}

describe('Create an account (demo)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm = true;
    useSession.getState().reset();
  });

  it('asks for a new password the password manager can save', async () => {
    await render(<Register />);
    expect(screen.getByTestId('password').props.autoComplete).toBe('new-password');
    expect(screen.getByTestId('password').props.textContentType).toBe('newPassword');
    await createAccount('fil@example.com', 'short');
    expect(screen.getByTestId('submit-login')).toBeDisabled();
  });

  it('saves the login as a hash with the new explorer, then logs in', async () => {
    await render(<Register />);
    await createAccount('Fil@Example.com', 'sintra-sunset-9');
    await finishProfile('fil_dm7');
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/(tabs)'));
    const s = useSession.getState();
    expect(s.signedIn).toBe(true);
    expect(s.profile?.username).toBe('fil_dm7');
    expect(s.account?.email).toBe('fil@example.com');
    expect(JSON.stringify(s.account)).not.toContain('sintra-sunset-9');
    expect(await verifyPassword('sintra-sunset-9', s.account!)).toBe(true);
  });

  it('sends an existing email to the login instead', async () => {
    await render(<Register />);
    await createAccount('fil@example.com', 'sintra-sunset-9');
    await finishProfile('fil_dm7');
    useSession.getState().signOut();
    await render(<Register />);
    await createAccount('fil@example.com', 'another-pass-1');
    expect(await screen.findByText(/Log in instead/)).toBeOnTheScreen();
  });

  it('only replaces the explorer on this device after confirming', async () => {
    useSession
      .getState()
      .completeOnboarding({ username: 'old_one', homeCity: '', explorerStyles: ['nature'] });
    mockConfirm = false;
    await render(<Register />);
    await createAccount('new@example.com', 'sintra-sunset-9');
    expect(useSession.getState().profile?.username).toBe('old_one');
    expect(screen.queryByTestId('username')).toBeNull();

    mockConfirm = true;
    await submitAndSettle();
    expect(await screen.findByTestId('username')).toBeOnTheScreen();
    expect(useSession.getState().profile).toBeNull();
  });
});
