import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';
import type { ReactNode } from 'react';
import CheckEmail from '../../app/check-email';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
  useLocalSearchParams: () => ({ email: 'fdmvlogs7@gmail.com', kind: 'reset' }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));

describe('Check your email', () => {
  it('says where the reset link went and opens Gmail', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await render(<CheckEmail />);
    expect(
      screen.getByText(/Wandro Support sent a password reset link to f•••7@gmail.com/),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('open-mailbox'));
    expect(open).toHaveBeenCalledWith('https://mail.google.com/');
    expect(screen.getByTestId('resend-email')).toBeDisabled();
    expect(screen.getByTestId('resend-email')).toHaveTextContent('Send again in 60s');
  });
});
