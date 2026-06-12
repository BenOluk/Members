import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

// Formato: scrypt$<salt hex>$<hash hex>
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function newSessionToken(): string {
  return randomBytes(32).toString('hex');
}

// O DB guarda só o hash do token — vazamento do DB não vaza sessões.
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
