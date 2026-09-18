import { getDb, newId } from './db';
import { hashSessionToken } from './crypto';
/** Incremento atômico; chaves derivadas por hash não armazenam e-mail/IP em claro. */
export async function consumeLimit(key: string, limit: number, windowMs: number, now = Date.now()): Promise<boolean> {
    const db = getDb();
    (await db.prepare('DELETE FROM rate_limits WHERE reset_at <= ?').run(now));
    const row = (await db.prepare(`INSERT INTO rate_limits (key, count, reset_at) VALUES (?,1,?)
    ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count`).get(hashSessionToken(key), now + windowMs)) as {
        count: number;
    };
    return row.count <= limit;
}
export async function audit(actorId: string | null, action: string, targetId: string | null = null): Promise<void> {
    (await getDb().prepare('INSERT INTO audit_log (id, actor_id, action, target_id, created_at) VALUES (?,?,?,?,?)')
        .run(newId('audit'), actorId, action, targetId, new Date().toISOString()));
}
