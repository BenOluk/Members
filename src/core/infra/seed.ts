import type { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './crypto';
import {
  mockBadges,
  mockCategories,
  mockCertificates,
  mockCourses,
  mockEnrollments,
  mockEvents,
  mockNotifications,
  mockPosts,
  mockSpaces,
  mockUsers,
} from './seedData';

// Senha inicial de TODOS os usuários seed (trocar no admin em produção).
export const SEED_PASSWORD = 'sanctum123';

export function seedIfEmpty(db: DatabaseSync): void {
  const row = db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number };
  if (row.n > 0) return;

  db.exec('BEGIN');
  try {
    const insertUser = db.prepare(
      `INSERT INTO users (id, email, password_hash, name, handle, avatar, role, bio, location,
         joined_at, xp, streak_current, streak_longest, last_activity_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    );
    const insertUserBadge = db.prepare(
      'INSERT INTO user_badges (user_id, badge_id, awarded_at) VALUES (?,?,?)',
    );
    const insertCompleted = db.prepare(
      'INSERT INTO user_completed_lessons (user_id, lesson_id, completed_at) VALUES (?,?,?)',
    );
    const insertFollow = db.prepare(
      'INSERT INTO follows (follower_id, followee_id) VALUES (?,?)',
    );

    for (const b of mockBadges) {
      db.prepare('INSERT INTO badges (id, name, description, icon, rarity) VALUES (?,?,?,?,?)')
        .run(b.id, b.name, b.description, b.icon, b.rarity);
    }

    for (const u of mockUsers) {
      insertUser.run(
        u.id, u.email, hashPassword(SEED_PASSWORD), u.name, u.handle, u.avatar, u.role,
        u.bio ?? null, u.location ?? null, u.joinedAt, u.xp,
        u.streak.current, u.streak.longest, u.streak.lastActivityAt,
      );
      for (const badgeId of u.badgeIds) insertUserBadge.run(u.id, badgeId, u.joinedAt);
      for (const lessonId of u.completedLessonIds) insertCompleted.run(u.id, lessonId, u.streak.lastActivityAt);
      for (const followee of u.followingUserIds) insertFollow.run(u.id, followee);
    }

    for (const [i, c] of mockCategories.entries()) {
      db.prepare('INSERT INTO categories (id, label, description, accent, sort) VALUES (?,?,?,?,?)')
        .run(c.id, c.label, c.description, c.accent, i);
    }

    const insertCourse = db.prepare(
      `INSERT INTO courses (id, title, subtitle, description, thumbnail, cover_image, category_id,
         instructor_id, tags, level, featured, is_published, published_at,
         total_enrollments, rating_average, rating_count)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    );
    const insertModule = db.prepare('INSERT INTO modules (id, course_id, title, sort) VALUES (?,?,?,?)');
    const insertLesson = db.prepare(
      `INSERT INTO lessons (id, module_id, title, description, video_url, duration, sort, xp_reward)
       VALUES (?,?,?,?,?,?,?,?)`,
    );
    const insertResource = db.prepare(
      'INSERT INTO lesson_resources (id, lesson_id, kind, title, url, size_bytes) VALUES (?,?,?,?,?,?)',
    );

    for (const c of mockCourses) {
      insertCourse.run(
        c.id, c.title, c.subtitle, c.description, c.thumbnail, c.coverImage, c.categoryId,
        c.instructorId, JSON.stringify(c.tags), c.level, c.featured ? 1 : 0,
        c.isPublished ? 1 : 0, c.publishedAt, c.totalEnrollments, c.ratingAverage, c.ratingCount,
      );
      for (const m of c.modules) {
        insertModule.run(m.id, c.id, m.title, m.order);
        for (const l of m.lessons) {
          insertLesson.run(l.id, m.id, l.title, l.description, l.videoUrl, l.duration, l.order, l.xpReward);
          for (const r of l.resources) {
            insertResource.run(r.id, l.id, r.kind, r.title, r.url, r.sizeBytes ?? null);
          }
        }
      }
    }

    for (const e of mockEnrollments) {
      db.prepare(
        `INSERT INTO enrollments (id, user_id, course_id, enrolled_at, last_watched_lesson_id, last_watched_at, completed_at)
         VALUES (?,?,?,?,?,?,?)`,
      ).run(e.id, e.userId, e.courseId, e.enrolledAt, e.lastWatchedLessonId ?? null, e.lastWatchedAt ?? null, e.completedAt ?? null);
    }
    // Matrículas dos demais usuários seed (enrolledCourseIds sem registro explícito).
    for (const u of mockUsers) {
      for (const courseId of u.enrolledCourseIds) {
        const exists = db.prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?').get(u.id, courseId);
        if (!exists) {
          db.prepare('INSERT INTO enrollments (id, user_id, course_id, enrolled_at) VALUES (?,?,?,?)')
            .run(`e_${u.id}_${courseId}`, u.id, courseId, u.joinedAt);
        }
      }
    }

    for (const c of mockCertificates) {
      db.prepare('INSERT INTO certificates (id, user_id, course_id, issued_at, credential_code) VALUES (?,?,?,?,?)')
        .run(c.id, c.userId, c.courseId, c.issuedAt, c.credentialCode);
    }

    for (const s of mockSpaces) {
      db.prepare(
        'INSERT INTO spaces (id, name, slug, description, icon, visibility, member_count, category_label) VALUES (?,?,?,?,?,?,?,?)',
      ).run(s.id, s.name, s.slug, s.description, s.icon, s.visibility, s.memberCount, s.categoryLabel);
    }

    for (const p of mockPosts) {
      db.prepare(
        'INSERT INTO posts (id, space_id, author_id, title, content, created_at, pinned) VALUES (?,?,?,?,?,?,?)',
      ).run(p.id, p.spaceId, p.authorId, p.title ?? null, p.content, p.createdAt, p.pinned ? 1 : 0);
      for (const userId of p.likedByUserIds) {
        db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?,?)').run(p.id, userId);
      }
      for (const c of p.comments) {
        db.prepare('INSERT INTO comments (id, post_id, author_id, content, created_at, likes) VALUES (?,?,?,?,?,?)')
          .run(c.id, p.id, c.authorId, c.content, c.createdAt, c.likes);
      }
    }

    for (const e of mockEvents) {
      db.prepare(
        `INSERT INTO events (id, title, description, kind, cover_image, host_user_id, starts_at,
           duration_minutes, join_url, attendee_count, max_attendees)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(e.id, e.title, e.description, e.kind, e.coverImage, e.hostUserId, e.startsAt,
        e.durationMinutes, e.joinUrl, e.attendeeCount, e.maxAttendees ?? null);
    }

    for (const n of mockNotifications) {
      db.prepare(
        'INSERT INTO notifications (id, user_id, kind, title, body, href, read, created_at) VALUES (?,?,?,?,?,?,?,?)',
      ).run(n.id, n.userId, n.kind, n.title, n.body, n.href ?? null, n.read ? 1 : 0, n.createdAt);
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
