import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import Customise from '../../app/customise';
import { useSession } from '@/state/session';
import { queryWrapper } from '@/test/queryWrapper';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));

describe('Customise your explorer', () => {
  // The first render compiles the avatar art; slow on a cold CI cache.
  jest.setTimeout(20_000);

  beforeEach(() => {
    useSession.getState().reset();
    useSession
      .getState()
      .completeOnboarding({ username: 'me', homeCity: 'Lisbon', explorerStyles: [] });
    jest.mocked(router.push).mockClear();
  });

  it('picks a different explorer', async () => {
    await render(<Customise />, { wrapper: queryWrapper() });
    expect(screen.getByTestId('customise-stage')).toBeOnTheScreen();
    await act(async () => void fireEvent.press(screen.getByTestId('customise-explorer-e5')));
    expect(useSession.getState().profile?.explorer).toBe('e5');
    expect(screen.getByTestId('customise-explorer-e5')).toBeChecked();
  });

  it('wears an outfit you own, and sends you to the Store for one you don’t', async () => {
    const at = new Date().toISOString();
    useSession.setState((s) => ({
      inventory: { ...s.inventory, owned: { skin_ocean: at } },
    }));
    await render(<Customise />, { wrapper: queryWrapper() });
    await fireEvent.press(screen.getByTestId('customise-tab-outfit'));
    await act(async () => void fireEvent.press(screen.getByTestId('customise-outfit-skin_ocean')));
    expect(useSession.getState().inventory.equipped.skin).toBe('skin_ocean');
    expect(screen.getByLabelText(/Coral jacket, locked/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('customise-outfit-skin_coral'));
    expect(router.push).toHaveBeenCalledWith('/shop');
    expect(useSession.getState().inventory.equipped.skin).toBe('skin_ocean');
  });

  it('puts on and takes off a hat', async () => {
    const at = new Date().toISOString();
    useSession.setState((s) => ({ inventory: { ...s.inventory, owned: { hat_top: at } } }));
    await render(<Customise />, { wrapper: queryWrapper() });
    await fireEvent.press(screen.getByTestId('customise-tab-hat'));
    await act(async () => void fireEvent.press(screen.getByTestId('customise-hat-hat_top')));
    expect(useSession.getState().inventory.equipped.hat).toBe('hat_top');
    await act(async () => void fireEvent.press(screen.getByTestId('customise-hat-none')));
    expect(useSession.getState().inventory.equipped.hat).toBeUndefined();
  });
});
