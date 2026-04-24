import type { Post, Space, User } from '../domain/entities';
import { mockPosts, mockSpaces } from '../infra/mockData';

export function listSpaces(): Space[] {
  return mockSpaces;
}

export function getSpaceById(spaceId: string): Space | undefined {
  return mockSpaces.find((s) => s.id === spaceId);
}

export function getSpaceBySlug(slug: string): Space | undefined {
  return mockSpaces.find((s) => s.slug === slug);
}

export function canUserAccessSpace(user: User, space: Space): boolean {
  if (space.visibility === 'public') return true;
  if (space.visibility === 'members') return true;
  // premium: admin/moderator ou regra futura de tier premium
  return user.role === 'admin' || user.role === 'moderator';
}

export function groupedSpaces(): Array<{ categoryLabel: string; spaces: Space[] }> {
  const by = new Map<string, Space[]>();
  for (const s of mockSpaces) {
    const list = by.get(s.categoryLabel) ?? [];
    list.push(s);
    by.set(s.categoryLabel, list);
  }
  // ordem preferida
  const preferred = ['Principal', 'Estudos', 'Suporte', 'Eventos', 'Premium'];
  return preferred
    .filter((label) => by.has(label))
    .map((label) => ({ categoryLabel: label, spaces: by.get(label)! }));
}

export function listPosts(options?: { spaceId?: string }): Post[] {
  const filtered = options?.spaceId
    ? mockPosts.filter((p) => p.spaceId === options.spaceId)
    : mockPosts;
  return [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function getPostById(postId: string): Post | undefined {
  return mockPosts.find((p) => p.id === postId);
}

export function countCommentsBySpace(spaceId: string): number {
  return mockPosts
    .filter((p) => p.spaceId === spaceId)
    .reduce((acc, p) => acc + p.comments.length, 0);
}

export function countPostsBySpace(spaceId: string): number {
  return mockPosts.filter((p) => p.spaceId === spaceId).length;
}
