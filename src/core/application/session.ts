import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '../domain/entities';
import { hashSessionToken } from '../infra/crypto';
import * as sessionsRepo from '../infra/repos/sessions';
import * as usersRepo from '../infra/repos/users';

export const SESSION_COOKIE = 'sanctum_session';

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = sessionsRepo.getUserId(hashSessionToken(token));
  if (!userId) return null;
  return usersRepo.getById(userId) ?? null;
}

/** Para páginas/actions de membro: redireciona anônimos para /login. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

/** Para páginas/actions do admin. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== 'admin') redirect('/');
  return user;
}

export function isAdmin(user: User): boolean {
  return user.role === 'admin';
}

export function isModerator(user: User): boolean {
  return user.role === 'moderator' || user.role === 'admin';
}
