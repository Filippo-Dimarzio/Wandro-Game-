import {
  hashPassword,
  looksLikeEmail,
  normaliseEmail,
  PBKDF2_ITERATIONS,
  verifyPassword,
} from './password';

describe('demo password hashes', () => {
  it('checks the right password and refuses a wrong one', async () => {
    const stored = await hashPassword('correct horse battery');
    expect(stored.iterations).toBe(PBKDF2_ITERATIONS);
    expect(await verifyPassword('correct horse battery', stored)).toBe(true);
    expect(await verifyPassword('correct horse batterz', stored)).toBe(false);
    expect(await verifyPassword('', stored)).toBe(false);
  });

  it('never keeps the password, and salts every hash', async () => {
    const a = await hashPassword('hunter2hunter2', 1000);
    const b = await hashPassword('hunter2hunter2', 1000);
    expect(JSON.stringify(a)).not.toContain('hunter2');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('verifies with the iterations stored alongside the hash', async () => {
    const stored = await hashPassword('another-password', 2000);
    expect(await verifyPassword('another-password', stored)).toBe(true);
    expect(await verifyPassword('another-password', { ...stored, iterations: 2001 })).toBe(false);
  });
});

describe('emails', () => {
  it('normalises and sanity-checks the login email', () => {
    expect(normaliseEmail('  Fil@Example.COM ')).toBe('fil@example.com');
    expect(looksLikeEmail('fil@example.com')).toBe(true);
    expect(looksLikeEmail('fil@example')).toBe(false);
    expect(looksLikeEmail('not an email')).toBe(false);
  });
});
