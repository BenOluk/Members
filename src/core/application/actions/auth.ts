'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { hashSessionToken, newSessionToken, verifyPassword } from '@/core/infra/crypto';
import * as sessionsRepo from '@/core/infra/repos/sessions';
import * as usersRepo from '@/core/infra/repos/users';
import { SESSION_COOKIE } from '../session';

const SESSION_DAYS = 30;

export async function login(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  const auth = email && password ? usersRepo.getAuthByEmail(email) : undefined;
  // Mesma resposta para e-mail inexistente e senha errada (não vaza contas).
  if (!auth || !verifyPassword(password, auth.passwordHash)) {
    redirect('/login?erro=1');
  }

  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  sessionsRepo.create(hashSessionToken(token), auth.id, expiresAt);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DAYS * 86_400,
    path: '/',
  });

  redirect('/');
}

export async function logout(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) sessionsRepo.remove(hashSessionToken(token));
  store.delete(SESSION_COOKIE);
  redirect('/login');
}
