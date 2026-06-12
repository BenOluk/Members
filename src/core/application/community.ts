import type { Post, Space, User } from '../domain/entities';
import * as communityRepo from '../infra/repos/community';

export function listSpaces(): Space[] {
  return communityRepo.listSpaces();
}

export function getSpaceById(spaceId: string): Space | undefined {
  return communityRepo.getSpaceById(spaceId);
}

export function canUserAccessSpace(user: User, space: Space): boolean {
  if (space.visibility === 'public') return true;
  if (space.visibility === 'members') return true;
  // premium: admin/moderator ou regra futura de tier premium
  return user.role === 'admin' || user.role === 'moderator';
}

export function groupedSpaces(): Array<{ categoryLabel: string; spaces: Space[] }> {
  const by = new Map<string, Space[]>();
  for (const s of communityRepo.listSpaces()) {
    const list = by.get(s.categoryLabel) ?? [];
    list.push(s);
    by.set(s.categoryLabel, list);
  }
  // Ordem preferida; categorias novas criadas no admin entram no fim.
  const preferred = ['Principal', 'Estudos', 'Suporte', 'Eventos', 'Premium'];
  const rest = [...by.keys()].filter((label) => !preferred.includes(label)).sort();
  return [...preferred, ...rest]
    .filter((label) => by.has(label))
    .map((label) => ({ categoryLabel: label, spaces: by.get(label)! }));
}

export function listPosts(options?: { spaceId?: string }): Post[] {
  return communityRepo.listPosts(options);
}

export function getPostById(postId: string): Post | undefined {
  return communityRepo.getPostById(postId);
}

export function countCommentsBySpace(spaceId: string): number {
  return communityRepo.countCommentsBySpace(spaceId);
}

export function countPostsBySpace(spaceId: string): number {
  return communityRepo.countPostsBySpace(spaceId);
}
