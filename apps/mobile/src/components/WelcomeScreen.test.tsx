import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import Welcome from '../../app/welcome';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: () => null }));

describe('Entry portal', () => {
  it('stays revealed after releasing the hold', async () => {
    jest.useFakeTimers();
    await render(<Welcome />);
    await fireEvent(screen.getByTestId('portal-hold'), 'pressIn');
    await act(async () => void jest.advanceTimersByTime(1500));
    expect(screen.getByText('Bora? Start exploring')).toBeOnTheScreen();
    jest.useRealTimers();
  });

  it('screen-reader activate reveals without holding', async () => {
    await render(<Welcome />);
    await fireEvent(screen.getByTestId('portal-hold'), 'accessibilityAction', {
      nativeEvent: { actionName: 'activate' },
    });
    expect(screen.getByText('Bora? Start exploring')).toBeOnTheScreen();
  });
});
