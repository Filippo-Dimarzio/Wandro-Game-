import { cleanSource, waitlistErrors } from './waitlist';

const complete = {
  email: 'ana@example.pt',
  livesIn: 'lisbon',
  occupation: 'both',
  transport: ['metro'],
  interests: ['culture'],
  fogWalk: 'yes',
  consent: true,
} as const;

describe('waitlist', () => {
  it('accepts a complete sign-up', () => {
    expect(
      waitlistErrors({
        ...complete,
        transport: [...complete.transport],
        interests: [...complete.interests],
      }),
    ).toEqual([]);
  });

  it('asks for a real email, the required answers and consent', () => {
    expect(waitlistErrors({ email: 'not-an-email' })).toEqual([
      'email',
      'livesIn',
      'occupation',
      'fogWalk',
      'consent',
    ]);
  });

  it('never sends without consent', () => {
    expect(waitlistErrors({ ...complete, transport: [], interests: [], consent: false })).toEqual([
      'consent',
    ]);
  });

  it('keeps link sources short and plain', () => {
    expect(cleanSource('Instagram')).toBe('instagram');
    expect(cleanSource('ads-a')).toBe('ads-a');
    expect(cleanSource('<script>alert(1)</script>')).toBe('scriptalert1script');
    expect(cleanSource('x'.repeat(80))).toHaveLength(32);
    expect(cleanSource(undefined)).toBeUndefined();
  });
});
