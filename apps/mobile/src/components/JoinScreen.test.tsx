import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import Join from '../../app/join';
import { queryWrapper } from '@/test/queryWrapper';

const mockEnv = { waitlistUrl: 'https://script.google.com/macros/s/test/exec' };
jest.mock('@/lib/env', () => ({
  isDemo: true,
  get env() {
    return { supabaseUrl: '', supabaseAnonKey: '', mapboxToken: '', ...mockEnv };
  },
}));
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ src: 'Instagram' }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));

const wrapper = queryWrapper();

async function fillIn() {
  await fireEvent.changeText(screen.getByTestId('join-email'), ' ana@example.pt ');
  await fireEvent.press(screen.getByTestId('lives-lisbon'));
  await fireEvent.press(screen.getByTestId('occ-both'));
  await fireEvent.press(screen.getByTestId('transport-metro'));
  await fireEvent.press(screen.getByTestId('transport-walk'));
  await fireEvent.press(screen.getByTestId('interests-culture'));
  await fireEvent.press(screen.getByTestId('fog-yes'));
  await fireEvent.press(screen.getByTestId('join-consent'));
}

describe('/join (beta waitlist)', () => {
  beforeEach(() => {
    mockEnv.waitlistUrl = 'https://script.google.com/macros/s/test/exec';
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
  });

  it('points out missing answers instead of sending', async () => {
    await render(<Join />, { wrapper });
    await fireEvent.press(screen.getByTestId('join-submit'));
    expect(screen.getByText('A few answers are missing above.')).toBeTruthy();
    expect(screen.getByText('We need your OK to email you about the beta.')).toBeTruthy();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('sends a complete sign-up with where the visitor came from', async () => {
    await render(<Join />, { wrapper });
    await fillIn();
    await fireEvent.press(screen.getByTestId('join-submit'));
    await waitFor(() => expect(screen.getByTestId('join-done')).toBeTruthy());
    const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(mockEnv.waitlistUrl);
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      email: 'ana@example.pt',
      livesIn: 'lisbon',
      occupation: 'both',
      transport: ['metro', 'walk'],
      interests: ['culture'],
      fogWalk: 'yes',
      consent: true,
      source: 'instagram',
    });
  });

  it('says sign-ups open soon when nothing is connected yet', async () => {
    mockEnv.waitlistUrl = '';
    await render(<Join />, { wrapper });
    await fillIn();
    await fireEvent.press(screen.getByTestId('join-submit'));
    await waitFor(() =>
      expect(
        screen.getByText('Sign-ups open very soon. Meanwhile, try the demo below.'),
      ).toBeTruthy(),
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
