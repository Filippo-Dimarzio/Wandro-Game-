import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
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
jest.mock('@/lib/confirm', () => ({ confirmAction: jest.fn(async () => mockConfirm) }));
jest.mock('@/lib/download', () => ({ saveJson: jest.fn(async () => undefined) }));

let mockConfirm = true;
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

  it('changes the username, refusing invalid or taken ones', async () => {
    await render(<Settings />, { wrapper });
    const box = screen.getByTestId('settings-username');
    expect(box.props.value).toBe('filippo');
    await fireEvent.changeText(box, 'no spaces');
    expect(screen.getByTestId('save-username')).toBeDisabled();
    await fireEvent.changeText(box, 'ines.wanders');
    await fireEvent.press(screen.getByTestId('save-username'));
    expect(await screen.findByText('That username is taken. Try another one.')).toBeOnTheScreen();
    expect(useSession.getState().profile?.username).toBe('filippo');
    await fireEvent.changeText(box, 'fil_dm7');
    await fireEvent.press(screen.getByTestId('save-username'));
    await waitFor(() => expect(useSession.getState().profile?.username).toBe('fil_dm7'));
  });

  it('saves social handles, from @handles or pasted links', async () => {
    await render(<Settings />, { wrapper });
    await fireEvent.changeText(
      screen.getByTestId('social-instagram'),
      'https://instagram.com/fil.dm7',
    );
    await fireEvent.changeText(screen.getByTestId('social-x'), 'https://evil.example/fil');
    expect(screen.getByTestId('save-socials')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('social-x'), '@fil_dm7');
    await fireEvent.changeText(screen.getByTestId('social-tripbff'), 'fil-dm7');
    await fireEvent.press(screen.getByTestId('save-socials'));
    await waitFor(() =>
      expect(useSession.getState().profile?.socials).toEqual({
        instagram: 'fil.dm7',
        x: 'fil_dm7',
        tripbff: 'fil-dm7',
      }),
    );
  });

  it('makes the account private', async () => {
    await render(<Settings />, { wrapper });
    await fireEvent(screen.getByTestId('private-switch'), 'valueChange', true);
    expect(useSession.getState().profile?.isPrivate).toBe(true);
  });

  it('without a login, logging out clears the explorer and returns to the portal', async () => {
    mockConfirm = false;
    await render(<Settings />, { wrapper });
    await fireEvent.press(screen.getByTestId('log-out'));
    expect(useSession.getState().onboarded).toBe(true);

    mockConfirm = true;
    await fireEvent.press(screen.getByTestId('log-out'));
    expect(useSession.getState().onboarded).toBe(false);
    expect(router.replace).toHaveBeenCalledWith('/welcome');
  });

  it('offers to add a login to an explorer that has none', async () => {
    await render(<Settings />, { wrapper });
    await fireEvent.press(screen.getByTestId('add-login'));
    expect(router.push).toHaveBeenCalledWith('/add-login');
  });

  it('with a login, logging out keeps the explorer for the next login', async () => {
    useSession
      .getState()
      .setAccount({ email: 'fil@example.com', salt: '00', hash: 'ab', iterations: 1 });
    mockConfirm = true;
    await render(<Settings />, { wrapper });
    expect(screen.getByTestId('logged-in-as')).toHaveTextContent('Logged in as fil@example.com');
    expect(screen.queryByTestId('add-login')).toBeNull();
    await fireEvent.press(screen.getByTestId('change-password'));
    expect(router.push).toHaveBeenCalledWith('/change-password');
    await fireEvent.press(screen.getByTestId('log-out'));
    const s = useSession.getState();
    expect(s.signedIn).toBe(false);
    expect(s.onboarded).toBe(true);
    expect(s.profile?.username).toBe('filippo');
    expect(router.replace).toHaveBeenCalledWith('/login');
  });
});
