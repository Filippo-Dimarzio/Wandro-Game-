import { appLink } from './auth';

jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('expo-linking', () => ({ createURL: (p: string) => `wandro://${p.replace(/^\//, '')}` }));

describe('appLink', () => {
  it('uses the app scheme on phones', () => {
    expect(appLink('/reset-password')).toBe('wandro://reset-password');
  });
});
