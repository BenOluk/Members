'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { hashSessionToken, newSessionToken, verifyPassword } from '@/core/infra/crypto';
import * as sessionsRepo from '@/core/infra/repos/sessions';
import * as usersRepo from '@/core/infra/repos/users';
import { SESSION_COOKIE } from '../session';
import { consumeLimit } from '@/core/infra/security';
import { validEmail } from '@/core/domain/validation';
import { hashPassword } from '@/core/infra/crypto';
const DUMMY_HASH = hashPassword('constant-work-for-unknown-account');
const SESSION_DAYS = 30;
export async function login(formData: FormData): Promise<void> {
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');
    if (!validEmail(email) || password.length > 128 || !password)
        redirect('/login?erro=1');
    if (!(await consumeLimit(`login:${email}`, 10, 15 * 60000)) || !(await consumeLimit('login:global', 300, 60000))) {
        redirect('/login?erro=limite');
    }
    const auth = email && password ? (await usersRepo.getAuthByEmail(email)) : undefined;
    // Mesma resposta para e-mail inexistente e senha errada (não vaza contas).
    const verified = verifyPassword(password, auth?.passwordHash ?? DUMMY_HASH);
    if (!auth || !verified) {
        redirect('/login?erro=1');
    }
    const token = newSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
    (await sessionsRepo.create(hashSessionToken(token), auth.id, expiresAt));
    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: SESSION_DAYS * 86400,
        path: '/',
    });
    redirect('/');
}
export async function logout(): Promise<void> {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (token)
        (await sessionsRepo.remove(hashSessionToken(token)));
    store.delete(SESSION_COOKIE);
    redirect('/login');
}
