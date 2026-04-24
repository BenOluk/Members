import type { User } from '../domain/entities';
import { mockUsers } from '../infra/mockData';

// Session mock. Em produção: JWT/OAuth + cookie httpOnly.
// Centralizado aqui para ser substituído por adapter real sem tocar na UI.
export function getCurrentUser(): User {
  return mockUsers[0];
}

export function isAdmin(user: User): boolean {
  return user.role === 'admin';
}

export function isModerator(user: User): boolean {
  return user.role === 'moderator' || user.role === 'admin';
}
