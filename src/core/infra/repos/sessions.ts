import { getDb } from '../db';

export function create(tokenHash: string, userId: string, expiresAt: string): void {
  getDb()
    .prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,?)')
    .run(tokenHash, userId, expiresAt);
}

/** Valida e devolve o userId; remove sessões expiradas no caminho. */
export function getUserId(tokenHash: string): string | undefined {
  const db = getDb();
  const row = db
    .prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?')
    .get(tokenHash) as { user_id: string; expires_at: string } | undefined;
  if (!row) return undefined;
  if (row.expires_at <= new Date().toISOString()) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
    return undefined;
  }
  return row.user_id;
}

export function remove(tokenHash: string): void {
  getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
}
