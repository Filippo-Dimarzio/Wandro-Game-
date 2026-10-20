import { render, screen } from '@testing-library/react-native';
import Index from '../../app/index';
import { useSession } from '@/state/session';

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text: T } = jest.requireActual('react-native');
    return <T testID="redirect">{href}</T>;
  },
}));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('@/state/useHydrated', () => ({ useHydrated: () => true }));

const profile = { username: 'fil_dm7', homeCity: 'Lisbon', explorerStyles: ['nature'] };
const login = { email: 'fil@example.com', salt: '00', hash: 'ab', iterations: 1 };

async function startsAt() {
  await render(<Index />);
  return screen.getByTestId('redirect').props.children as string;
}

describe('Where the app starts (demo)', () => {
  beforeEach(() => useSession.getState().reset());

  it('a first visit opens the portal', async () => {
    expect(await startsAt()).toBe('/welcome');
  });

  it('a logged-in explorer goes straight to the game', async () => {
    useSession.getState().completeOnboarding(profile, login);
    expect(await startsAt()).toBe('/(tabs)');
  });

  it('after logging out, the app opens on the login', async () => {
    useSession.getState().completeOnboarding(profile, login);
    useSession.getState().signOut();
    expect(await startsAt()).toBe('/login');
  });

  it('explorers saved before logins existed stay logged in', async () => {
    const persist = (
      useSession as unknown as {
        persist: { getOptions: () => { migrate: (s: unknown, v: number) => unknown } };
      }
    ).persist;
    const migrated = persist.getOptions().migrate({ onboarded: true, profile }, 3) as {
      signedIn: boolean;
      account: unknown;
    };
    expect(migrated.signedIn).toBe(true);
    expect(migrated.account).toBeNull();
  });
});
