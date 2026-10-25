import { render, screen } from '@testing-library/react-native';
import Index from '../../app/index';
import { useSession } from '@/state/session';

jest.mock('@/lib/env', () => ({ isDemo: false }));
jest.mock('@/lib/auth', () => ({ useAuthSession: () => ({ session: null, loading: false }) }));
jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text: T } = jest.requireActual('react-native');
    return <T testID="redirect">{href}</T>;
  },
}));
jest.mock('@/state/useHydrated', () => ({ useHydrated: () => true }));

const profile = { username: 'fil_dm7', homeCity: 'Lisbon', explorerStyles: ['nature'] };
const login = { email: 'fil@example.com', salt: '00', hash: 'ab', iterations: 1 };

describe('Where the app starts (connected to the server)', () => {
  beforeEach(() => useSession.getState().reset());

  it('a demo explorer left on the device is cleared and the player creates a real account', async () => {
    useSession.getState().completeOnboarding(profile, login);
    useSession.getState().signOut();
    await render(<Index />);
    expect(await screen.findByTestId('redirect')).toHaveTextContent('/register');
    const s = useSession.getState();
    expect(s.demoRetired).toBe(true);
    expect(s.account).toBeNull();
    expect(s.onboarded).toBe(false);
  });

  it('a server player whose session ended goes to the login', async () => {
    useSession.getState().completeOnboarding(profile);
    await render(<Index />);
    expect(screen.getByTestId('redirect')).toHaveTextContent('/login');
    expect(useSession.getState().demoRetired).toBe(false);
  });
});
