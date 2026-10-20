import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import ChangePassword from '../../app/change-password';
import { hashPassword, verifyPassword } from '@/lib/password';
import { useSession } from '@/state/session';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn(), canGoBack: () => true },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/lib/passwordManager', () => ({ offerToSavePassword: jest.fn(async () => undefined) }));

const { offerToSavePassword } = jest.requireMock('@/lib/passwordManager') as {
  offerToSavePassword: jest.Mock;
};

describe('Change password (demo)', () => {
  beforeEach(async () => {
    useSession.getState().reset();
    useSession
      .getState()
      .completeOnboarding(
        { username: 'fil_dm7', homeCity: 'Lisbon', explorerStyles: ['art'] },
        { email: 'fil@example.com', ...(await hashPassword('old-password-1', 1000)) },
      );
  });

  it('needs the current password, then saves only a hash of the new one', async () => {
    await render(<ChangePassword />);
    expect(screen.getByTestId('email').props.value).toBe('fil@example.com');
    expect(screen.getByTestId('current-password').props.autoComplete).toBe('current-password');
    expect(screen.getByTestId('new-password').props.autoComplete).toBe('new-password');

    await fireEvent.changeText(screen.getByTestId('current-password'), 'not-it');
    await fireEvent.changeText(screen.getByTestId('new-password'), 'brand-new-pass-2');
    await fireEvent.press(screen.getByTestId('save-password'));
    expect(await screen.findByText('Your current password isn’t right.')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByTestId('current-password'), 'old-password-1');
    await fireEvent.changeText(screen.getByTestId('new-password'), 'brand-new-pass-2');
    await fireEvent.press(screen.getByTestId('save-password'));
    expect(await screen.findByText(/Password changed/)).toBeOnTheScreen();
    await waitFor(async () =>
      expect(await verifyPassword('brand-new-pass-2', useSession.getState().account!)).toBe(true),
    );
    expect(JSON.stringify(useSession.getState().account)).not.toContain('brand-new-pass-2');
    expect(offerToSavePassword).toHaveBeenCalledWith({
      email: 'fil@example.com',
      password: 'brand-new-pass-2',
      name: 'fil_dm7',
    });
  });
});
