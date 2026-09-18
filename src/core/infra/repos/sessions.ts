import { getDb } from '../db';
export async function create(tokenHash: string, userId: string, expiresAt: string): Promise<void> {
    (await getDb()
        .prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,?)')
        .run(tokenHash, userId, expiresAt));
}
/** Valida e devolve o userId; remove sessões expiradas no caminho. */
export async function getUserId(tokenHash: string): Promise<string | undefined> {
    const db = getDb();
    const row = (await db
        .prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?')
        .get(tokenHash)) as {
        user_id: string;
        expires_at: string;
    } | undefined;
    if (!row)
        return undefined;
    if (row.expires_at <= new Date().toISOString()) {
        (await db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash));
        return undefined;
    }
    return row.user_id;
}
export async function remove(tokenHash: string): Promise<void> {
    (await getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash));
}
