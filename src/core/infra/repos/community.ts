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
export async function listSpaces(): Promise<Space[]> {
    const rows = (await getDb().prepare('SELECT * FROM spaces').all()) as unknown as SpaceRow[];
    return rows.map(toSpace);
}
export async function getSpaceById(spaceId: string): Promise<Space | undefined> {
    const row = (await getDb().prepare('SELECT * FROM spaces WHERE id = ?').get(spaceId)) as SpaceRow | undefined;
    return row ? toSpace(row) : undefined;
}
export async function saveSpace(input: {
    id?: string;
    name: string;
    description: string;
    icon: string;
    visibility: SpaceVisibility;
    categoryLabel: string;
}): Promise<string> {
    const db = getDb();
    if (input.id) {
        (await db.prepare('UPDATE spaces SET name=?, description=?, icon=?, visibility=?, category_label=? WHERE id=?')
            .run(input.name, input.description, input.icon, input.visibility, input.categoryLabel, input.id));
        return input.id;
    }
    const id = newId('sp');
    const slug = input.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || id;
    (await db.prepare('INSERT INTO spaces (id, name, slug, description, icon, visibility, member_count, category_label) VALUES (?,?,?,?,?,?,0,?)').run(id, input.name, slug, input.description, input.icon, input.visibility, input.categoryLabel));
    return id;
}
export async function removeSpace(spaceId: string): Promise<void> {
    (await getDb().prepare('DELETE FROM spaces WHERE id = ?').run(spaceId));
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
async function toPost(row: PostRow): Promise<Post> {
    const db = getDb();
    const likedBy = ((await db.prepare('SELECT user_id FROM post_likes WHERE post_id = ?').all(row.id)) as Record<string, string>[])
        .map((r) => r.user_id);
    const comments = (await db
        .prepare('SELECT id, post_id, author_id, content, created_at, likes FROM comments WHERE post_id = ? ORDER BY created_at')
        .all(row.id)) as unknown as Array<{
        id: string;
        post_id: string;
        author_id: string;
        content: string;
        created_at: string;
        likes: number;
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
export async function listPosts(opts?: {
    spaceId?: string;
}): Promise<Post[]> {
    const rows = (opts?.spaceId
        ? (await getDb().prepare('SELECT * FROM posts WHERE space_id = ? ORDER BY pinned DESC, created_at DESC').all(opts.spaceId)) : (await getDb().prepare('SELECT * FROM posts ORDER BY pinned DESC, created_at DESC').all())) as unknown as PostRow[];
    return (await Promise.all(rows.map(toPost)));
}
export async function getPostById(postId: string): Promise<Post | undefined> {
    const row = (await getDb().prepare('SELECT * FROM posts WHERE id = ?').get(postId)) as PostRow | undefined;
    return row ? (await toPost(row)) : undefined;
}
export async function createPost(input: {
    spaceId: string;
    authorId: string;
    title?: string;
    content: string;
}): Promise<string> {
    const id = newId('post');
    (await getDb()
        .prepare('INSERT INTO posts (id, space_id, author_id, title, content, created_at, pinned) VALUES (?,?,?,?,?,?,0)')
        .run(id, input.spaceId, input.authorId, input.title ?? null, input.content, new Date().toISOString()));
    return id;
}
export async function removePost(postId: string): Promise<void> {
    (await getDb().prepare('DELETE FROM posts WHERE id = ?').run(postId));
}
export async function setPinned(postId: string, pinned: boolean): Promise<void> {
    (await getDb().prepare('UPDATE posts SET pinned = ? WHERE id = ?').run(pinned ? 1 : 0, postId));
}
/** @returns true se o like foi adicionado; false se removido (toggle). */
export async function toggleLike(postId: string, userId: string): Promise<boolean> {
    const db = getDb();
    const removed = (await db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(postId, userId));
    if (removed.changes > 0)
        return false;
    (await db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?,?)').run(postId, userId));
    return true;
}
export async function addComment(input: {
    postId: string;
    authorId: string;
    content: string;
}): Promise<string> {
    const id = newId('c');
    (await getDb()
        .prepare('INSERT INTO comments (id, post_id, author_id, content, created_at, likes) VALUES (?,?,?,?,?,0)')
        .run(id, input.postId, input.authorId, input.content, new Date().toISOString()));
    return id;
}
export async function countPostsBySpace(spaceId: string): Promise<number> {
    const row = (await getDb().prepare('SELECT COUNT(*) AS n FROM posts WHERE space_id = ?').get(spaceId)) as {
        n: number;
    };
    return row.n;
}
export async function countCommentsBySpace(spaceId: string): Promise<number> {
    const row = (await getDb()
        .prepare('SELECT COUNT(*) AS n FROM comments c JOIN posts p ON p.id = c.post_id WHERE p.space_id = ?')
        .get(spaceId)) as {
        n: number;
    };
    return row.n;
}
export async function countAllPosts(): Promise<number> {
    const row = (await getDb().prepare('SELECT COUNT(*) AS n FROM posts').get()) as {
        n: number;
    };
    return row.n;
}
