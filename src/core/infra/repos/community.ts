import type { Comment, Post, Space, SpaceVisibility } from '@/core/domain/entities';
import { getDb, newId } from '../db';

// ---------- Spaces ----------------------------------------------------------

interface SpaceRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  visibility: string;
  member_count: number;
  category_label: string;
}

function toSpace(row: SpaceRow): Space {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    visibility: row.visibility as SpaceVisibility,
    memberCount: row.member_count,
    categoryLabel: row.category_label,
  };
}

export function listSpaces(): Space[] {
  const rows = getDb().prepare('SELECT * FROM spaces').all() as unknown as SpaceRow[];
  return rows.map(toSpace);
}

export function getSpaceById(spaceId: string): Space | undefined {
  const row = getDb().prepare('SELECT * FROM spaces WHERE id = ?').get(spaceId) as SpaceRow | undefined;
  return row ? toSpace(row) : undefined;
}

export function saveSpace(input: {
  id?: string;
  name: string;
  description: string;
  icon: string;
  visibility: SpaceVisibility;
  categoryLabel: string;
}): string {
  const db = getDb();
  if (input.id) {
    db.prepare('UPDATE spaces SET name=?, description=?, icon=?, visibility=?, category_label=? WHERE id=?')
      .run(input.name, input.description, input.icon, input.visibility, input.categoryLabel, input.id);
    return input.id;
  }
  const id = newId('sp');
  const slug = input.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || id;
  db.prepare(
    'INSERT INTO spaces (id, name, slug, description, icon, visibility, member_count, category_label) VALUES (?,?,?,?,?,?,0,?)',
  ).run(id, input.name, slug, input.description, input.icon, input.visibility, input.categoryLabel);
  return id;
}

export function removeSpace(spaceId: string): void {
  getDb().prepare('DELETE FROM spaces WHERE id = ?').run(spaceId);
}

// ---------- Posts -----------------------------------------------------------

interface PostRow {
  id: string;
  space_id: string;
  author_id: string;
  title: string | null;
  content: string;
  created_at: string;
  pinned: number;
}

function toPost(row: PostRow): Post {
  const db = getDb();
  const likedBy = (db.prepare('SELECT user_id FROM post_likes WHERE post_id = ?').all(row.id) as Record<string, string>[])
    .map((r) => r.user_id);
  const comments = db
    .prepare('SELECT id, post_id, author_id, content, created_at, likes FROM comments WHERE post_id = ? ORDER BY created_at')
    .all(row.id) as unknown as Array<{
      id: string; post_id: string; author_id: string; content: string; created_at: string; likes: number;
    }>;

  return {
    id: row.id,
    spaceId: row.space_id,
    authorId: row.author_id,
    title: row.title ?? undefined,
    content: row.content,
    likes: likedBy.length,
    likedByUserIds: likedBy,
    createdAt: row.created_at,
    pinned: row.pinned === 1,
    comments: comments.map<Comment>((c) => ({
      id: c.id,
      postId: c.post_id,
      authorId: c.author_id,
      content: c.content,
      createdAt: c.created_at,
      likes: c.likes,
    })),
  };
}

export function listPosts(opts?: { spaceId?: string }): Post[] {
  const rows = (
    opts?.spaceId
      ? getDb().prepare('SELECT * FROM posts WHERE space_id = ? ORDER BY pinned DESC, created_at DESC').all(opts.spaceId)
      : getDb().prepare('SELECT * FROM posts ORDER BY pinned DESC, created_at DESC').all()
  ) as unknown as PostRow[];
  return rows.map(toPost);
}

export function getPostById(postId: string): Post | undefined {
  const row = getDb().prepare('SELECT * FROM posts WHERE id = ?').get(postId) as PostRow | undefined;
  return row ? toPost(row) : undefined;
}

export function createPost(input: { spaceId: string; authorId: string; title?: string; content: string }): string {
  const id = newId('post');
  getDb()
    .prepare('INSERT INTO posts (id, space_id, author_id, title, content, created_at, pinned) VALUES (?,?,?,?,?,?,0)')
    .run(id, input.spaceId, input.authorId, input.title ?? null, input.content, new Date().toISOString());
  return id;
}

export function removePost(postId: string): void {
  getDb().prepare('DELETE FROM posts WHERE id = ?').run(postId);
}

export function setPinned(postId: string, pinned: boolean): void {
  getDb().prepare('UPDATE posts SET pinned = ? WHERE id = ?').run(pinned ? 1 : 0, postId);
}

/** @returns true se o like foi adicionado; false se removido (toggle). */
export function toggleLike(postId: string, userId: string): boolean {
  const db = getDb();
  const removed = db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(postId, userId);
  if (removed.changes > 0) return false;
  db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?,?)').run(postId, userId);
  return true;
}

export function addComment(input: { postId: string; authorId: string; content: string }): string {
  const id = newId('c');
  getDb()
    .prepare('INSERT INTO comments (id, post_id, author_id, content, created_at, likes) VALUES (?,?,?,?,?,0)')
    .run(id, input.postId, input.authorId, input.content, new Date().toISOString());
  return id;
}

export function countPostsBySpace(spaceId: string): number {
  const row = getDb().prepare('SELECT COUNT(*) AS n FROM posts WHERE space_id = ?').get(spaceId) as { n: number };
  return row.n;
}

export function countCommentsBySpace(spaceId: string): number {
  const row = getDb()
    .prepare('SELECT COUNT(*) AS n FROM comments c JOIN posts p ON p.id = c.post_id WHERE p.space_id = ?')
    .get(spaceId) as { n: number };
  return row.n;
}

export function countAllPosts(): number {
  const row = getDb().prepare('SELECT COUNT(*) AS n FROM posts').get() as { n: number };
  return row.n;
}
