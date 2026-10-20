/**
 * Demo-mode logins. There is no server in the demo, so the device checks the password itself.
 * It keeps only a salted PBKDF2 hash, never the password: the player's password manager keeps
 * that. With Supabase connected, Supabase Auth checks passwords instead and none of this is used.
 */

/** OWASP's 2023 guidance for PBKDF2-HMAC-SHA256. */
export const PBKDF2_ITERATIONS = 600_000;

export interface PasswordHash {
  salt: string;
  hash: string;
  iterations: number;
}

function subtle(): SubtleCrypto | undefined {
  return globalThis.crypto?.subtle;
}

/** Browsers have WebCrypto; a native demo build may not, and then skips the demo login. */
export function canHashPasswords(): boolean {
  return !!subtle() && typeof globalThis.crypto?.getRandomValues === 'function';
}

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const s = subtle();
  if (!s) throw new Error('crypto_unavailable');
  const key = await s.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await s.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return toHex(new Uint8Array(bits));
}

export async function hashPassword(
  password: string,
  iterations = PBKDF2_ITERATIONS,
): Promise<PasswordHash> {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return { salt: toHex(salt), hash: await derive(password, salt, iterations), iterations };
}

export async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
  const hash = await derive(password, fromHex(stored.salt), stored.iterations);
  // Compare every character so the time taken doesn't hint at how much matched.
  let diff = hash.length ^ stored.hash.length;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ stored.hash.charCodeAt(i);
  return diff === 0;
}

/** Sign-up has always asked for at least 8 characters. */
export const MIN_PASSWORD_LENGTH = 8;

export const normaliseEmail = (email: string) => email.trim().toLowerCase();

export const looksLikeEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
