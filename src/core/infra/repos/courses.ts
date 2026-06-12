import type {
  Course,
  CourseCategory,
  CourseCategoryId,
  CourseDraft,
  Enrollment,
  Lesson,
  Module,
} from '@/core/domain/entities';
import { getDb, newId } from '../db';

interface CourseRow {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  thumbnail: string;
  cover_image: string;
  category_id: string;
  instructor_id: string;
  tags: string;
  level: string;
  featured: number;
  is_published: number;
  published_at: string;
  total_enrollments: number;
  rating_average: number;
  rating_count: number;
}

function toCourse(row: CourseRow): Course {
  const db = getDb();
  const moduleRows = db
    .prepare('SELECT id, title, sort FROM modules WHERE course_id = ? ORDER BY sort')
    .all(row.id) as unknown as Array<{ id: string; title: string; sort: number }>;

  const modules: Module[] = moduleRows.map((m) => {
    const lessonRows = db
      .prepare('SELECT id, title, description, video_url, duration, sort, xp_reward FROM lessons WHERE module_id = ? ORDER BY sort')
      .all(m.id) as unknown as Array<{
        id: string; title: string; description: string; video_url: string;
        duration: number; sort: number; xp_reward: number;
      }>;
    const lessons: Lesson[] = lessonRows.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      videoUrl: l.video_url,
      duration: l.duration,
      order: l.sort,
      xpReward: l.xp_reward,
      resources: (db
        .prepare('SELECT id, kind, title, url, size_bytes FROM lesson_resources WHERE lesson_id = ?')
        .all(l.id) as unknown as Array<{ id: string; kind: string; title: string; url: string; size_bytes: number | null }>)
        .map((r) => ({
          id: r.id,
          kind: r.kind as Lesson['resources'][number]['kind'],
          title: r.title,
          url: r.url,
          sizeBytes: r.size_bytes ?? undefined,
        })),
    }));
    return { id: m.id, title: m.title, order: m.sort, lessons };
  });

  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    thumbnail: row.thumbnail,
    coverImage: row.cover_image,
    categoryId: row.category_id as CourseCategoryId,
    instructorId: row.instructor_id,
    modules,
    tags: JSON.parse(row.tags) as string[],
    level: row.level as Course['level'],
    featured: row.featured === 1,
    isPublished: row.is_published === 1,
    publishedAt: row.published_at,
    totalEnrollments: row.total_enrollments,
    ratingAverage: row.rating_average,
    ratingCount: row.rating_count,
  };
}

export function list(opts?: { includeUnpublished?: boolean }): Course[] {
  const sql = opts?.includeUnpublished
    ? 'SELECT * FROM courses ORDER BY published_at DESC'
    : 'SELECT * FROM courses WHERE is_published = 1 ORDER BY published_at DESC';
  const rows = getDb().prepare(sql).all() as unknown as CourseRow[];
  return rows.map(toCourse);
}

export function getById(courseId: string): Course | undefined {
  const row = getDb().prepare('SELECT * FROM courses WHERE id = ?').get(courseId) as CourseRow | undefined;
  return row ? toCourse(row) : undefined;
}

export function listCategories(): CourseCategory[] {
  return getDb()
    .prepare('SELECT id, label, description, accent FROM categories ORDER BY sort')
    .all() as unknown as CourseCategory[];
}

// ---------- Admin CRUD ------------------------------------------------------

export function save(draft: CourseDraft): string {
  const db = getDb();
  const courseId = draft.id ?? newId('course');
  db.exec('BEGIN');
  try {
    if (draft.id) {
      db.prepare(
        `UPDATE courses SET title=?, subtitle=?, description=?, thumbnail=?, cover_image=?,
           category_id=?, instructor_id=?, tags=?, level=?, featured=?, is_published=?
         WHERE id=?`,
      ).run(draft.title, draft.subtitle, draft.description, draft.thumbnail, draft.coverImage,
        draft.categoryId, draft.instructorId, JSON.stringify(draft.tags), draft.level,
        draft.featured ? 1 : 0, draft.isPublished ? 1 : 0, courseId);
    } else {
      db.prepare(
        `INSERT INTO courses (id, title, subtitle, description, thumbnail, cover_image, category_id,
           instructor_id, tags, level, featured, is_published, published_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(courseId, draft.title, draft.subtitle, draft.description, draft.thumbnail, draft.coverImage,
        draft.categoryId, draft.instructorId, JSON.stringify(draft.tags), draft.level,
        draft.featured ? 1 : 0, draft.isPublished ? 1 : 0, new Date().toISOString());
    }

    // Remove módulos/aulas que saíram do draft (cascade limpa aulas/recursos).
    const keptModuleIds = draft.modules.map((m) => m.id).filter(Boolean) as string[];
    const placeholders = keptModuleIds.map(() => '?').join(',');
    db.prepare(
      keptModuleIds.length > 0
        ? `DELETE FROM modules WHERE course_id = ? AND id NOT IN (${placeholders})`
        : 'DELETE FROM modules WHERE course_id = ?',
    ).run(courseId, ...keptModuleIds);

    draft.modules.forEach((m, mi) => {
      const moduleId = m.id ?? newId('mod');
      db.prepare(
        `INSERT INTO modules (id, course_id, title, sort) VALUES (?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET title = excluded.title, sort = excluded.sort`,
      ).run(moduleId, courseId, m.title, mi + 1);

      const keptLessonIds = m.lessons.map((l) => l.id).filter(Boolean) as string[];
      const lp = keptLessonIds.map(() => '?').join(',');
      db.prepare(
        keptLessonIds.length > 0
          ? `DELETE FROM lessons WHERE module_id = ? AND id NOT IN (${lp})`
          : 'DELETE FROM lessons WHERE module_id = ?',
      ).run(moduleId, ...keptLessonIds);

      m.lessons.forEach((l, li) => {
        const lessonId = l.id ?? newId('lesson');
        db.prepare(
          `INSERT INTO lessons (id, module_id, title, description, video_url, duration, sort, xp_reward)
           VALUES (?,?,?,?,?,?,?,?)
           ON CONFLICT(id) DO UPDATE SET module_id = excluded.module_id, title = excluded.title,
             description = excluded.description, video_url = excluded.video_url,
             duration = excluded.duration, sort = excluded.sort, xp_reward = excluded.xp_reward`,
        ).run(lessonId, moduleId, l.title, l.description, l.videoUrl, l.duration, li + 1, l.xpReward);
      });
    });

    db.exec('COMMIT');
    return courseId;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function remove(courseId: string): void {
  getDb().prepare('DELETE FROM courses WHERE id = ?').run(courseId);
}

export function setPublished(courseId: string, published: boolean): void {
  getDb().prepare('UPDATE courses SET is_published = ? WHERE id = ?').run(published ? 1 : 0, courseId);
}

// ---------- Enrollments -----------------------------------------------------

interface EnrollmentRow {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  last_watched_lesson_id: string | null;
  last_watched_at: string | null;
  completed_at: string | null;
}

function toEnrollment(row: EnrollmentRow): Enrollment {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    enrolledAt: row.enrolled_at,
    lastWatchedLessonId: row.last_watched_lesson_id ?? undefined,
    lastWatchedAt: row.last_watched_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
  };
}

export function getEnrollmentsForUser(userId: string): Enrollment[] {
  const rows = getDb().prepare('SELECT * FROM enrollments WHERE user_id = ?').all(userId) as unknown as EnrollmentRow[];
  return rows.map(toEnrollment);
}

export function getEnrollment(userId: string, courseId: string): Enrollment | undefined {
  const row = getDb()
    .prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?')
    .get(userId, courseId) as EnrollmentRow | undefined;
  return row ? toEnrollment(row) : undefined;
}

export function createEnrollment(userId: string, courseId: string): void {
  const res = getDb()
    .prepare('INSERT OR IGNORE INTO enrollments (id, user_id, course_id, enrolled_at) VALUES (?,?,?,?)')
    .run(newId('enr'), userId, courseId, new Date().toISOString());
  if (res.changes > 0) {
    getDb().prepare('UPDATE courses SET total_enrollments = total_enrollments + 1 WHERE id = ?').run(courseId);
  }
}

export function removeEnrollment(userId: string, courseId: string): void {
  const res = getDb().prepare('DELETE FROM enrollments WHERE user_id = ? AND course_id = ?').run(userId, courseId);
  if (res.changes > 0) {
    getDb().prepare('UPDATE courses SET total_enrollments = MAX(total_enrollments - 1, 0) WHERE id = ?').run(courseId);
  }
}

export function touchEnrollment(userId: string, courseId: string, lessonId: string, at: string): void {
  getDb()
    .prepare('UPDATE enrollments SET last_watched_lesson_id = ?, last_watched_at = ? WHERE user_id = ? AND course_id = ?')
    .run(lessonId, at, userId, courseId);
}

export function completeEnrollment(userId: string, courseId: string, at: string): void {
  getDb()
    .prepare('UPDATE enrollments SET completed_at = ? WHERE user_id = ? AND course_id = ? AND completed_at IS NULL')
    .run(at, userId, courseId);
}
