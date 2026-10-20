import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import Login from '../../app/login';
import { hashPassword } from '@/lib/password';
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

const { offerToSavePassword } = jest.requireMock('@/lib/passwordManager') as {
  offerToSavePassword: jest.Mock;
};

async function deviceWithLogin() {
  useSession.getState().reset();
  useSession
    .getState()
    .completeOnboarding(
      { username: 'fil_dm7', homeCity: 'Lisbon', explorerStyles: ['nature'] },
      { email: 'fil@example.com', ...(await hashPassword('sintra-sunset-9', 1000)) },
    );
  useSession.getState().signOut();
}

describe('Login (demo)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await deviceWithLogin();
  });

  it('marks the fields up for password managers', async () => {
    await render(<Login />);
    const email = screen.getByTestId('email');
    const password = screen.getByTestId('password');
    expect(email.props.autoComplete).toBe('username');
    expect(email.props.textContentType).toBe('username');
    expect(password.props.autoComplete).toBe('current-password');
    expect(password.props.textContentType).toBe('password');
    expect(password.props.secureTextEntry).toBe(true);
    await fireEvent.press(screen.getByTestId('toggle-password'));
    expect(screen.getByTestId('password').props.secureTextEntry).toBe(false);
  });

  it('refuses a wrong password and keeps you logged out', async () => {
    await render(<Login />);
    expect(screen.getByTestId('email').props.value).toBe('fil@example.com');
    await fireEvent.changeText(screen.getByTestId('password'), 'wrong-password');
    await fireEvent.press(screen.getByTestId('submit-login'));
    expect(await screen.findByText('That email and password don’t match.')).toBeOnTheScreen();
    expect(useSession.getState().signedIn).toBe(false);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('logs in with the right password, keeps the explorer and offers to save it', async () => {
    await render(<Login />);
    await fireEvent.changeText(screen.getByTestId('email'), ' Fil@Example.com ');
    await fireEvent.changeText(screen.getByTestId('password'), 'sintra-sunset-9');
    await fireEvent(screen.getByTestId('password'), 'submitEditing');
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/(tabs)'));
    expect(useSession.getState().signedIn).toBe(true);
    expect(useSession.getState().profile?.username).toBe('fil_dm7');
    expect(offerToSavePassword).toHaveBeenCalledWith({
      email: 'fil@example.com',
      password: 'sintra-sunset-9',
      name: 'fil_dm7',
    });
  });

  it('says when the email has no explorer on this device', async () => {
    await render(<Login />);
    await fireEvent.changeText(screen.getByTestId('email'), 'someone@else.com');
    await fireEvent.changeText(screen.getByTestId('password'), 'sintra-sunset-9');
    await fireEvent.press(screen.getByTestId('submit-login'));
    expect(await screen.findByText(/No explorer with that email on this device/)).toBeOnTheScreen();
  });

  it('explains that demo passwords cannot be reset by email', async () => {
    await render(<Login />);
    await fireEvent.press(screen.getByTestId('forgot-password'));
    expect(screen.getByText(/no reset email/)).toBeOnTheScreen();
  });

  it('links to creating an account', async () => {
    await render(<Login />);
    await fireEvent.press(screen.getByTestId('go-register'));
    expect(router.replace).toHaveBeenCalledWith('/register');
  });
});
