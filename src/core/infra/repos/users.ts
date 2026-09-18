import type { Badge, User, UserRole } from '@/core/domain/entities';
import { getDb, newId } from '../db';
interface UserRow {
    badge_ids: string;
    lesson_ids: string;
    course_ids: string;
    following_ids: string;
    id: string;
    email: string;
    name: string;
    handle: string;
    avatar: string;
    role: string;
    status: 'active' | 'suspended';
    bio: string | null;
    location: string | null;
    joined_at: string;
    xp: number;
    streak_current: number;
    streak_longest: number;
    last_activity_at: string;
}
async function toUser(row: UserRow): Promise<User> {
    return {
        id: row.id,
        name: row.name,
        handle: row.handle,
        email: row.email,
        avatar: row.avatar,
        role: row.role as UserRole,
        status: row.status,
        bio: row.bio ?? undefined,
        location: row.location ?? undefined,
        joinedAt: row.joined_at,
        xp: row.xp,
        streak: { current: row.streak_current, longest: row.streak_longest, lastActivityAt: row.last_activity_at },
        badgeIds: JSON.parse(row.badge_ids),
        completedLessonIds: JSON.parse(row.lesson_ids),
        enrolledCourseIds: JSON.parse(row.course_ids),
        followingUserIds: JSON.parse(row.following_ids),
    };
}
const USER_COLS = `id, email, name, handle, avatar, role, status, bio, location,
  joined_at, xp, streak_current, streak_longest, last_activity_at,
  (SELECT json_group_array(badge_id) FROM user_badges WHERE user_id=users.id) AS badge_ids,
  (SELECT json_group_array(lesson_id) FROM user_completed_lessons WHERE user_id=users.id) AS lesson_ids,
  (SELECT json_group_array(course_id) FROM enrollments WHERE user_id=users.id) AS course_ids,
  (SELECT json_group_array(followee_id) FROM follows WHERE follower_id=users.id) AS following_ids`;
export async function getById(userId: string): Promise<User | undefined> {
    const row = (await getDb().prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?`).get(userId)) as UserRow | undefined;
    return row ? (await toUser(row)) : undefined;
}
export async function getByHandle(handle: string): Promise<User | undefined> {
    const row = (await getDb().prepare(`SELECT ${USER_COLS} FROM users WHERE handle = ?`).get(handle)) as UserRow | undefined;
    return row ? (await toUser(row)) : undefined;
}
export async function list(): Promise<User[]> {
    const rows = (await getDb().prepare(`SELECT ${USER_COLS} FROM users ORDER BY xp DESC`).all()) as unknown as UserRow[];
    return (await Promise.all(rows.map(toUser)));
}
export async function getAuthByEmail(email: string): Promise<{
    id: string;
    passwordHash: string;
} | undefined> {
    const row = (await getDb()
        .prepare("SELECT id, password_hash FROM users WHERE email = ? COLLATE NOCASE AND status = 'active'")
        .get(email)) as {
        id: string;
        password_hash: string;
    } | undefined;
    return row ? { id: row.id, passwordHash: row.password_hash } : undefined;
}
export async function emailExists(email: string): Promise<boolean> {
    return Boolean((await getDb().prepare('SELECT 1 FROM users WHERE email = ? COLLATE NOCASE').get(email)));
}
export async function create(input: {
    name: string;
    email: string;
    handle: string;
    passwordHash: string;
    role: UserRole;
    avatar?: string;
}): Promise<User> {
    const id = newId('user');
    const now = new Date().toISOString();
    (await getDb()
        .prepare(`INSERT INTO users (id, email, password_hash, name, handle, avatar, role, joined_at, xp,
         streak_current, streak_longest, last_activity_at)
       VALUES (?,?,?,?,?,?,?,?,0,0,0,?)`)
        .run(id, input.email, input.passwordHash, input.name, input.handle, input.avatar ?? '/avatar.svg', input.role, now, now));
    return (await getById(id))!;
}
export async function setRole(userId: string, role: UserRole): Promise<void> {
    (await getDb().prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId));
}
export async function setPassword(userId: string, passwordHash: string): Promise<void> {
    (await getDb().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId));
    (await getDb().prepare('DELETE FROM sessions WHERE user_id = ?').run(userId));
    (await getDb().prepare('DELETE FROM password_tokens WHERE user_id = ?').run(userId));
}
export async function setStatus(userId: string, status: 'active' | 'suspended'): Promise<void> {
    (await getDb().prepare('UPDATE users SET status = ? WHERE id = ?').run(status, userId));
    (await getDb().prepare('DELETE FROM sessions WHERE user_id = ?').run(userId));
}
export async function updateProfile(userId: string, name: string, bio: string, location: string): Promise<void> {
    (await getDb().prepare('UPDATE users SET name = ?, bio = ?, location = ? WHERE id = ?').run(name, bio, location, userId));
}
export async function addXp(userId: string, amount: number): Promise<void> {
    (await getDb().prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(amount, userId));
}
export async function setStreak(userId: string, current: number, longest: number, lastActivityAt: string): Promise<void> {
    (await getDb()
        .prepare('UPDATE users SET streak_current = ?, streak_longest = ?, last_activity_at = ? WHERE id = ?')
        .run(current, longest, lastActivityAt, userId));
}
/** @returns true se a aula ainda não estava concluída (inserção nova). */
export async function completeLesson(userId: string, lessonId: string, at: string): Promise<boolean> {
    const res = (await getDb()
        .prepare('INSERT OR IGNORE INTO user_completed_lessons (user_id, lesson_id, completed_at) VALUES (?,?,?)')
        .run(userId, lessonId, at));
    return res.changes > 0;
}
export async function countCompletedLessons(userId: string): Promise<number> {
    const row = (await getDb().prepare('SELECT COUNT(*) AS n FROM user_completed_lessons WHERE user_id = ?').get(userId)) as {
        n: number;
    };
    return row.n;
}
// ---------- Badges ----------------------------------------------------------
export async function listBadges(): Promise<Badge[]> {
    return (await getDb().prepare('SELECT * FROM badges').all()) as unknown as Badge[];
}
export async function getBadgeById(badgeId: string): Promise<Badge | undefined> {
    return (await getDb().prepare('SELECT * FROM badges WHERE id = ?').get(badgeId)) as Badge | undefined;
}
export async function getBadgesForUser(userId: string): Promise<Badge[]> {
    return (await getDb()
        .prepare(`SELECT b.id, b.name, b.description, b.icon, b.rarity, ub.awarded_at AS awardedAt
       FROM user_badges ub JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = ? ORDER BY ub.awarded_at`)
        .all(userId)) as unknown as Badge[];
}
/** @returns true se a badge foi concedida agora (não a tinha). */
export async function awardBadge(userId: string, badgeId: string, at: string): Promise<boolean> {
    const res = (await getDb()
        .prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id, awarded_at) VALUES (?,?,?)')
        .run(userId, badgeId, at));
    return res.changes > 0;
}
// ---------- Follows ---------------------------------------------------------
/** @returns true se passou a seguir; false se deixou de seguir. */
export async function toggleFollow(followerId: string, followeeId: string): Promise<boolean> {
    const db = getDb();
    const removed = (await db.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?').run(followerId, followeeId));
    if (removed.changes > 0)
        return false;
    (await db.prepare('INSERT INTO follows (follower_id, followee_id) VALUES (?,?)').run(followerId, followeeId));
    return true;
}
