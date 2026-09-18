import { getDb, transaction } from '../infra/db';
import { hashPassword, hashSessionToken, newSessionToken, verifyPassword } from '../infra/crypto';
import { audit, consumeLimit } from '../infra/security';
import * as users from '../infra/repos/users';
import { validEmail, validPassword } from '../domain/validation';
import { emailConfigured, sendAccessEmail } from '../infra/email';
export async function issuePasswordReset(actorId: string, userId: string): Promise<string | null> {
    const actor = (await users.getById(actorId));
    const user = (await users.getById(userId));
    if (actor?.role !== 'admin' || actor.status === 'suspended' || !user || user.status === 'suspended')
        return null;
    return createPasswordToken(userId, actorId);
}
async function createPasswordToken(userId: string, actorId: string | null): Promise<string> {
    const token = newSessionToken();
    (await transaction(async () => {
        (await getDb().prepare('DELETE FROM password_tokens WHERE user_id = ? OR expires_at <= ?').run(userId, new Date().toISOString()));
        (await getDb().prepare('INSERT INTO password_tokens (token_hash, user_id, expires_at) VALUES (?,?,?)')
            .run(hashSessionToken(token), userId, new Date(Date.now() + 60 * 60000).toISOString()));
        (await audit(actorId, 'password.link_created', userId));
    }));
    return token;
}
/** Resposta idêntica para conta ausente, suspensa, limitada ou com envio concluído. */
export async function requestAccessEmail(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    if (!emailConfigured() || !validEmail(normalized) || !await consumeLimit(`email-access:${normalized}`, 3, 3600000) || !await consumeLimit('email-access:global', 50, 3600000)) return;
    const account = await users.getAuthByEmail(normalized);
    if (!account) return;
    const token = await createPasswordToken(account.id, null);
    try {
        await sendAccessEmail(normalized, token);
        await audit(null, 'email.access_sent', account.id);
    } catch {
        await getDb().prepare('DELETE FROM password_tokens WHERE token_hash=?').run(hashSessionToken(token));
        await audit(null, 'email.access_failed', account.id);
    }
}
export async function resetPassword(token: string, password: string): Promise<boolean> {
    if (!/^[a-f0-9]{64}$/.test(token) || !validPassword(password) || !(await consumeLimit('password-reset:global', 100, 60000)))
        return false;
    return (await transaction(async () => {
        const row = (await getDb().prepare(`SELECT p.user_id FROM password_tokens p JOIN users u ON u.id=p.user_id
      WHERE p.token_hash=? AND p.expires_at>? AND u.status='active'`).get(hashSessionToken(token), new Date().toISOString())) as {
            user_id: string;
        } | undefined;
        if (!row)
            return false;
        (await users.setPassword(row.user_id, hashPassword(password)));
        (await audit(row.user_id, 'password.reset', row.user_id));
        return true;
    }));
}
export async function changePassword(userId: string, current: string, replacement: string): Promise<boolean> {
    if (!validPassword(replacement) || current.length > 128 || !(await consumeLimit(`password-change:${userId}`, 10, 15 * 60000)))
        return false;
    const user = (await users.getById(userId));
    const auth = user ? (await users.getAuthByEmail(user.email)) : undefined;
    if (!auth || !verifyPassword(current, auth.passwordHash))
        return false;
    (await transaction(async () => {
        (await users.setPassword(userId, hashPassword(replacement)));
        (await audit(userId, 'password.changed', userId));
    }));
    return true;
}
export async function editProfile(userId: string, name: string, bio: string, location: string): Promise<boolean> {
    if (!name.trim() || name.length > 100 || bio.length > 2000 || location.length > 150)
        return false;
    (await users.updateProfile(userId, name.trim(), bio.trim(), location.trim()));
    return true;
}
export async function exportAccount(userId: string): Promise<object> {
    const db = getDb();
    return {
        exportedAt: new Date().toISOString(),
        profile: (await users.getById(userId)),
        enrollments: (await db.prepare('SELECT * FROM enrollments WHERE user_id=?').all(userId)),
        notes: (await db.prepare('SELECT * FROM lesson_notes WHERE user_id=?').all(userId)),
        certificates: (await db.prepare('SELECT * FROM certificates WHERE user_id=?').all(userId)),
        posts: (await db.prepare('SELECT id, space_id, title, content, created_at FROM posts WHERE author_id=?').all(userId)),
        comments: (await db.prepare('SELECT id, post_id, content, created_at FROM comments WHERE author_id=?').all(userId)),
    };
}
