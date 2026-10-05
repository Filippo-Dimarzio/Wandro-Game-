import { fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { ThemeToggle } from './ThemeToggle';
import { useSession } from '@/state/session';
import { darkColors, lightColors, useColors } from '@/theme';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

describe('ThemeToggle', () => {
  beforeEach(() => useSession.getState().reset());

  it('switches between light and dark mode', async () => {
    await render(<ThemeToggle />);
    const toggle = screen.getByRole('switch', { name: 'Dark mode' });
    expect(toggle).not.toBeChecked();

    await fireEvent.press(toggle);
    expect(useSession.getState().prefs.theme).toBe('dark');
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeChecked();

    await fireEvent.press(screen.getByTestId('theme-toggle'));
    expect(useSession.getState().prefs.theme).toBe('light');
  });

  it('the choice decides the colours everywhere', async () => {
    useSession.getState().setTheme('dark');
    expect((await renderHook(() => useColors())).result.current).toBe(darkColors);
    useSession.getState().setTheme('light');
    expect((await renderHook(() => useColors())).result.current).toBe(lightColors);
  });
});
