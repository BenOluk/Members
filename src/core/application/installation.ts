import { timingSafeEqual } from 'node:crypto';
import { getDb, transaction } from '../infra/db';
import { hashPassword, hashSessionToken } from '../infra/crypto';
import { audit, consumeLimit } from '../infra/security';
import * as users from '../infra/repos/users';
import { validEmail, validPassword } from '../domain/validation';
export async function needsSetup(): Promise<boolean> {
    return !(await getDb().prepare('SELECT 1 FROM users LIMIT 1').get());
}
export async function installAdmin(input: {
    key: string;
    name: string;
    email: string;
    password: string;
}): Promise<boolean> {
    const expected = process.env.SETUP_KEY ?? '';
    if (expected.length < 32 || !(await consumeLimit('setup', 10, 15 * 60000)))
        return false;
    if (!timingSafeEqual(Buffer.from(hashSessionToken(input.key)), Buffer.from(hashSessionToken(expected))))
        return false;
    if (!input.name.trim() || input.name.length > 100 || !validEmail(input.email) || !validPassword(input.password))
        return false;
    const passwordHash = hashPassword(input.password);
    return (await transaction(async () => {
        if (!(await needsSetup()))
            return false;
        const admin = (await users.create({ name: input.name.trim(), email: input.email.toLowerCase().trim(), passwordHash, handle: 'administrador', role: 'admin' }));
        (await audit(admin.id, 'installation.created', admin.id));
        return true;
    }));
}
