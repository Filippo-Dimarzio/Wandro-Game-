import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import Welcome from '../../app/welcome';

jest.mock('expo-router', () => ({ router: { replace: jest.fn(), push: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: () => null }));

describe('Title screen', () => {
  it('needs no hold: one tap starts, and login is right there', async () => {
    await render(<Welcome />);
    expect(screen.queryByText(/Hold/)).toBeNull();
    await fireEvent.press(screen.getByTestId('portal-start'));
    expect(router.replace).toHaveBeenCalledWith('/register');
    await fireEvent.press(screen.getByTestId('portal-login'));
    expect(router.replace).toHaveBeenCalledWith('/login');
  });
});
