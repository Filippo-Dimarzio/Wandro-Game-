import { appLink, enabledProviders, isEmailSendFailure } from './auth';

jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('expo-linking', () => ({ createURL: (p: string) => `wandro://${p.replace(/^\//, '')}` }));

describe('appLink', () => {
  it('uses the app scheme on phones', () => {
    expect(appLink('/reset-password')).toBe('wandro://reset-password');
  });
});

describe('enabledProviders', () => {
  it('lists only the sign-in providers switched on in Supabase', () => {
    expect(enabledProviders({ external: { apple: false, google: true, email: true } })).toEqual([
      'google',
    ]);
    expect(enabledProviders({ external: { apple: true, google: true } })).toEqual([
      'apple',
      'google',
    ]);
    expect(enabledProviders({})).toEqual([]);
  });
});

describe('isEmailSendFailure', () => {
  it('spots a confirmation or reset email the mail sender refused', () => {
    expect(isEmailSendFailure({ message: 'Error sending confirmation email' })).toBe(true);
    expect(isEmailSendFailure({ message: 'Error sending recovery email' })).toBe(true);
    expect(isEmailSendFailure({ message: 'User already registered' })).toBe(false);
  });
});
