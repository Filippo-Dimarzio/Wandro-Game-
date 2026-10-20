import { cleanSocialLinks, parseSocialHandle, socialUrl } from './socials';

describe('social handles', () => {
  it('accepts handles, @handles and pasted profile links', () => {
    expect(parseSocialHandle('instagram', '@fil.dm7')).toBe('fil.dm7');
    expect(parseSocialHandle('instagram', 'https://www.instagram.com/fil.dm7/')).toBe('fil.dm7');
    expect(parseSocialHandle('x', 'twitter.com/fil_dm7')).toBe('fil_dm7');
    expect(parseSocialHandle('x', 'https://x.com/fil_dm7?s=21')).toBe('fil_dm7');
    expect(
      parseSocialHandle('facebook', 'https://m.facebook.com/profile.php?id=100012345678'),
    ).toBe('100012345678');
    expect(parseSocialHandle('facebook', 'facebook.com/filippo.dimarzio')).toBe('filippo.dimarzio');
    expect(parseSocialHandle('tripbff', 'fil-dm7')).toBe('fil-dm7');
  });

  it('an empty box removes the link', () => {
    expect(parseSocialHandle('instagram', '   ')).toBe('');
  });

  it('refuses links to other sites and handles the network would not allow', () => {
    expect(parseSocialHandle('instagram', 'https://evil.example/fil')).toBeNull();
    expect(parseSocialHandle('instagram', 'instagram.com.evil.example/fil')).toBeNull();
    expect(parseSocialHandle('x', 'this_handle_is_too_long')).toBeNull();
    expect(parseSocialHandle('instagram', 'fil dm7')).toBeNull();
    expect(parseSocialHandle('facebook', 'abc')).toBeNull();
  });

  it('builds each network’s profile link, and none for TripBFF', () => {
    expect(socialUrl('instagram', 'fil.dm7')).toBe('https://www.instagram.com/fil.dm7');
    expect(socialUrl('x', 'fil_dm7')).toBe('https://x.com/fil_dm7');
    expect(socialUrl('facebook', '100012345678')).toBe(
      'https://www.facebook.com/profile.php?id=100012345678',
    );
    expect(socialUrl('tripbff', 'fil-dm7')).toBeNull();
    expect(socialUrl('instagram', 'bad handle')).toBeNull();
  });

  it('keeps every handle the server would accept', () => {
    // valid_social_links allows [A-Za-z0-9._-]{1,50}; app rules must stay inside that.
    const server = /^[A-Za-z0-9._-]{1,50}$/;
    for (const [n, h] of [
      ['instagram', 'a.b_c'],
      ['facebook', '100012345678'],
      ['x', 'a_b'],
      ['tripbff', 'a-b.c'],
    ] as const)
      expect(server.test(parseSocialHandle(n, h)!)).toBe(true);
  });

  it('cleans stored links into display order', () => {
    expect(Object.keys(cleanSocialLinks({ x: 'fil', instagram: 'fil', tripbff: '' }))).toEqual([
      'instagram',
      'x',
    ]);
  });
});
