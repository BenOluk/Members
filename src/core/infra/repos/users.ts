import type { Badge, User, UserRole } from '@/core/domain/entities';
import { getDb, newId } from '../db';

interface UserRow {
  id: string;
  email: string;
  name: string;
  handle: string;
  avatar: string;
  role: string;
  bio: string | null;
  location: string | null;
  joined_at: string;
  xp: number;
  streak_current: number;
  streak_longest: number;
  last_activity_at: string;
}

function toUser(row: UserRow): User {
  const db = getDb();
  const ids = (sql: string, key: string): string[] =>
    (db.prepare(sql).all(row.id) as Record<string, string>[]).map((r) => r[key]);

  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    email: row.email,
    avatar: row.avatar,
    role: row.role as UserRole,
    bio: row.bio ?? undefined,
    location: row.location ?? undefined,
    joinedAt: row.joined_at,
    xp: row.xp,
    streak: { current: row.streak_current, longest: row.streak_longest, lastActivityAt: row.last_activity_at },
    badgeIds: ids('SELECT badge_id FROM user_badges WHERE user_id = ? ORDER BY awarded_at', 'badge_id'),
    completedLessonIds: ids('SELECT lesson_id FROM user_completed_lessons WHERE user_id = ?', 'lesson_id'),
    enrolledCourseIds: ids('SELECT course_id FROM enrollments WHERE user_id = ?', 'course_id'),
    followingUserIds: ids('SELECT followee_id FROM follows WHERE follower_id = ?', 'followee_id'),
  };
}

const USER_COLS = `id, email, name, handle, avatar, role, bio, location,
  joined_at, xp, streak_current, streak_longest, last_activity_at`;

export function getById(userId: string): User | undefined {
  const row = getDb().prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?`).get(userId) as UserRow | undefined;
  return row ? toUser(row) : undefined;
}

export function getByHandle(handle: string): User | undefined {
  const row = getDb().prepare(`SELECT ${USER_COLS} FROM users WHERE handle = ?`).get(handle) as UserRow | undefined;
  return row ? toUser(row) : undefined;
}

export function list(): User[] {
  const rows = getDb().prepare(`SELECT ${USER_COLS} FROM users ORDER BY xp DESC`).all() as unknown as UserRow[];
  return rows.map(toUser);
}

export function getAuthByEmail(email: string): { id: string; passwordHash: string } | undefined {
  const row = getDb()
    .prepare('SELECT id, password_hash FROM users WHERE email = ?')
    .get(email) as { id: string; password_hash: string } | undefined;
  return row ? { id: row.id, passwordHash: row.password_hash } : undefined;
}

export function emailExists(email: string): boolean {
  return Boolean(getDb().prepare('SELECT 1 FROM users WHERE email = ?').get(email));
}

export function create(input: {
  name: string;
  email: string;
  handle: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
}): User {
  const id = newId('user');
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO users (id, email, password_hash, name, handle, avatar, role, joined_at, xp,
         streak_current, streak_longest, last_activity_at)
       VALUES (?,?,?,?,?,?,?,?,0,0,0,?)`,
    )
    .run(id, input.email, input.passwordHash, input.name, input.handle,
      input.avatar ?? `https://i.pravatar.cc/150?u=${encodeURIComponent(input.email)}`,
      input.role, now, now);
  return getById(id)!;
}

export function setRole(userId: string, role: UserRole): void {
  getDb().prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
}

export function setPassword(userId: string, passwordHash: string): void {
  getDb().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId);
}

export function addXp(userId: string, amount: number): void {
  getDb().prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(amount, userId);
}

export function setStreak(userId: string, current: number, longest: number, lastActivityAt: string): void {
  getDb()
    .prepare('UPDATE users SET streak_current = ?, streak_longest = ?, last_activity_at = ? WHERE id = ?')
    .run(current, longest, lastActivityAt, userId);
}

/** @returns true se a aula ainda não estava concluída (inserção nova). */
export function completeLesson(userId: string, lessonId: string, at: string): boolean {
  const res = getDb()
    .prepare('INSERT OR IGNORE INTO user_completed_lessons (user_id, lesson_id, completed_at) VALUES (?,?,?)')
    .run(userId, lessonId, at);
  return res.changes > 0;
}

export function countCompletedLessons(userId: string): number {
  const row = getDb().prepare('SELECT COUNT(*) AS n FROM user_completed_lessons WHERE user_id = ?').get(userId) as { n: number };
  return row.n;
}

// ---------- Badges ----------------------------------------------------------

export function listBadges(): Badge[] {
  return getDb().prepare('SELECT * FROM badges').all() as unknown as Badge[];
}

export function getBadgeById(badgeId: string): Badge | undefined {
  return getDb().prepare('SELECT * FROM badges WHERE id = ?').get(badgeId) as Badge | undefined;
}

export function getBadgesForUser(userId: string): Badge[] {
  return getDb()
    .prepare(
      `SELECT b.id, b.name, b.description, b.icon, b.rarity, ub.awarded_at AS awardedAt
       FROM user_badges ub JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = ? ORDER BY ub.awarded_at`,
    )
    .all(userId) as unknown as Badge[];
}

/** @returns true se a badge foi concedida agora (não a tinha). */
export function awardBadge(userId: string, badgeId: string, at: string): boolean {
  const res = getDb()
    .prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id, awarded_at) VALUES (?,?,?)')
    .run(userId, badgeId, at);
  return res.changes > 0;
}

// ---------- Follows ---------------------------------------------------------

/** @returns true se passou a seguir; false se deixou de seguir. */
export function toggleFollow(followerId: string, followeeId: string): boolean {
  const db = getDb();
  const removed = db.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?').run(followerId, followeeId);
  if (removed.changes > 0) return false;
  db.prepare('INSERT INTO follows (follower_id, followee_id) VALUES (?,?)').run(followerId, followeeId);
  return true;
}
