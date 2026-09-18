import type { Course, CourseCategory, CourseCategoryId, CourseDraft, Enrollment, Lesson, Module, } from '@/core/domain/entities';
import { getDb, newId, transaction } from '../db';
import type { InStatement } from '@libsql/client';
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
async function toCourses(rows: CourseRow[]): Promise<Course[]> {
    if (!rows.length) return [];
    const db = getDb();
    const ids = rows.map((row) => row.id);
    const placeholders = ids.map(() => '?').join(',');
    const [moduleRows, lessonRows, resourceRows] = await Promise.all([
        db.prepare(`SELECT id,course_id,title,sort FROM modules WHERE course_id IN (${placeholders}) ORDER BY sort`).all(...ids),
        db.prepare(`SELECT l.* FROM lessons l JOIN modules m ON m.id=l.module_id WHERE m.course_id IN (${placeholders}) ORDER BY l.sort`).all(...ids),
        db.prepare(`SELECT r.* FROM lesson_resources r JOIN lessons l ON l.id=r.lesson_id JOIN modules m ON m.id=l.module_id WHERE m.course_id IN (${placeholders})`).all(...ids),
    ]);
    const resources = new Map<string, Lesson['resources']>();
    for (const r of resourceRows) {
        const key = String(r.lesson_id);
        const group = resources.get(key) ?? [];
        group.push({ id: String(r.id), kind: r.kind as Lesson['resources'][number]['kind'], title: String(r.title), url: String(r.url), sizeBytes: r.size_bytes === null ? undefined : Number(r.size_bytes) });
        resources.set(key, group);
    }
    const lessons = new Map<string, Lesson[]>();
    for (const l of lessonRows) {
        const key = String(l.module_id);
        const group = lessons.get(key) ?? [];
        group.push({ id: String(l.id), title: String(l.title), description: String(l.description), videoUrl: String(l.video_url), duration: Number(l.duration), order: Number(l.sort), xpReward: Number(l.xp_reward), resources: resources.get(String(l.id)) ?? [] });
        lessons.set(key, group);
    }
    const modules = new Map<string, Module[]>();
    for (const m of moduleRows) {
        const key = String(m.course_id);
        const group = modules.get(key) ?? [];
        group.push({ id: String(m.id), title: String(m.title), order: Number(m.sort), lessons: lessons.get(String(m.id)) ?? [] });
        modules.set(key, group);
    }
    return rows.map((row) => ({
        id: row.id, title: row.title, subtitle: row.subtitle, description: row.description,
        thumbnail: row.thumbnail, coverImage: row.cover_image, categoryId: row.category_id as CourseCategoryId,
        instructorId: row.instructor_id, modules: modules.get(row.id) ?? [],
        tags: JSON.parse(row.tags) as string[], level: row.level as Course['level'],
        featured: row.featured === 1, isPublished: row.is_published === 1,
        access: (row as CourseRow & { access: Course['access'] }).access,
        checkoutUrl: (row as CourseRow & { checkout_url: string }).checkout_url,
        publishedAt: row.published_at, totalEnrollments: row.total_enrollments,
        ratingAverage: row.rating_average, ratingCount: row.rating_count,
    }));
}
export async function list(opts?: {
    includeUnpublished?: boolean;
}): Promise<Course[]> {
    const sql = opts?.includeUnpublished
        ? 'SELECT * FROM courses ORDER BY published_at DESC'
        : 'SELECT * FROM courses WHERE is_published = 1 ORDER BY published_at DESC';
    const rows = (await getDb().prepare(sql).all()) as unknown as CourseRow[];
    return toCourses(rows);
}
export async function getById(courseId: string): Promise<Course | undefined> {
    const row = (await getDb().prepare('SELECT * FROM courses WHERE id = ?').get(courseId)) as CourseRow | undefined;
    return row ? (await toCourses([row]))[0] : undefined;
}
export async function listCategories(): Promise<CourseCategory[]> {
    return (await getDb()
        .prepare('SELECT id, label, description, accent FROM categories ORDER BY sort')
        .all()) as unknown as CourseCategory[];
}
// ---------- Admin CRUD ------------------------------------------------------
export async function save(draft: CourseDraft): Promise<string> {
    const db = getDb();
    const courseId = draft.id ?? newId('course');
    return transaction(async () => {
        if (draft.id) {
            (await db.prepare(`UPDATE courses SET title=?, subtitle=?, description=?, thumbnail=?, cover_image=?,
           category_id=?, instructor_id=?, tags=?, level=?, featured=?, is_published=?
         WHERE id=?`).run(draft.title, draft.subtitle, draft.description, draft.thumbnail, draft.coverImage, draft.categoryId, draft.instructorId, JSON.stringify(draft.tags), draft.level, draft.featured ? 1 : 0, draft.isPublished ? 1 : 0, courseId));
        }
        else {
            (await db.prepare(`INSERT INTO courses (id, title, subtitle, description, thumbnail, cover_image, category_id,
           instructor_id, tags, level, featured, is_published, published_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(courseId, draft.title, draft.subtitle, draft.description, draft.thumbnail, draft.coverImage, draft.categoryId, draft.instructorId, JSON.stringify(draft.tags), draft.level, draft.featured ? 1 : 0, draft.isPublished ? 1 : 0, new Date().toISOString()));
        }
        (await db.prepare('UPDATE courses SET access = ?, checkout_url = ? WHERE id = ?')
            .run(draft.access ?? 'enrollment', draft.checkoutUrl ?? '', courseId));
        // Um lote ordenado evita uma viagem de rede por aula/material.
        const statements: InStatement[] = [];
        const keptModuleIds = draft.modules.map((m) => m.id).filter(Boolean) as string[];
        statements.push({ sql: keptModuleIds.length ? `DELETE FROM modules WHERE course_id=? AND id NOT IN (${keptModuleIds.map(() => '?').join(',')})` : 'DELETE FROM modules WHERE course_id=?', args: [courseId, ...keptModuleIds] });
        for (const [mi, m] of draft.modules.entries()) {
            const moduleId = m.id ?? newId('mod');
            statements.push({ sql: 'INSERT INTO modules (id,course_id,title,sort) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,sort=excluded.sort', args: [moduleId, courseId, m.title, mi + 1] });
            const keptLessonIds = m.lessons.map((l) => l.id).filter(Boolean) as string[];
            statements.push({ sql: keptLessonIds.length ? `DELETE FROM lessons WHERE module_id=? AND id NOT IN (${keptLessonIds.map(() => '?').join(',')})` : 'DELETE FROM lessons WHERE module_id=?', args: [moduleId, ...keptLessonIds] });
            for (const [li, l] of m.lessons.entries()) {
                const lessonId = l.id ?? newId('lesson');
                statements.push({ sql: 'INSERT INTO lessons (id,module_id,title,description,video_url,duration,sort,xp_reward) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET module_id=excluded.module_id,title=excluded.title,description=excluded.description,video_url=excluded.video_url,duration=excluded.duration,sort=excluded.sort,xp_reward=excluded.xp_reward', args: [lessonId, moduleId, l.title, l.description, l.videoUrl, l.duration, li + 1, l.xpReward] });
                if (l.resources) {
                    statements.push({ sql: 'DELETE FROM lesson_resources WHERE lesson_id=?', args: [lessonId] });
                    for (const resource of l.resources) statements.push({ sql: 'INSERT INTO lesson_resources (id,lesson_id,kind,title,url,size_bytes) VALUES (?,?,?,?,?,?)', args: [newId('resource'), lessonId, resource.kind, resource.title, resource.url, resource.sizeBytes ?? null] });
                }
            }
        }
        if (statements.length) await db.batch(statements);
        return courseId;
    });
}
export async function remove(courseId: string): Promise<void> {
    (await getDb().prepare('DELETE FROM courses WHERE id = ?').run(courseId));
}
export async function setPublished(courseId: string, published: boolean): Promise<void> {
    (await getDb().prepare('UPDATE courses SET is_published = ? WHERE id = ?').run(published ? 1 : 0, courseId));
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
    expires_at: string | null;
    manual_access: number;
    blocked: number;
}
async function toEnrollment(row: EnrollmentRow): Promise<Enrollment> {
    const grants = await getDb().prepare('SELECT expires_at FROM access_grants WHERE user_id=? AND course_id=? AND revoked=0').all(row.user_id, row.course_id) as { expires_at: string | null }[];
    const expiries = [...(row.manual_access ? [row.expires_at] : []), ...grants.map((g) => g.expires_at)];
    const effectiveExpiry = row.blocked ? '1970-01-01T00:00:00.000Z' : expiries.includes(null) ? undefined : expiries.sort().at(-1) ?? '1970-01-01T00:00:00.000Z';
    return {
        id: row.id,
        userId: row.user_id,
        courseId: row.course_id,
        enrolledAt: row.enrolled_at,
        lastWatchedLessonId: row.last_watched_lesson_id ?? undefined,
        lastWatchedAt: row.last_watched_at ?? undefined,
        completedAt: row.completed_at ?? undefined,
        expiresAt: effectiveExpiry,
    };
}
export async function getEnrollmentsForUser(userId: string): Promise<Enrollment[]> {
    const rows = (await getDb().prepare('SELECT * FROM enrollments WHERE user_id = ?').all(userId)) as unknown as EnrollmentRow[];
    return Promise.all(rows.map(toEnrollment));
}
export async function getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined> {
    const row = (await getDb()
        .prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?')
        .get(userId, courseId)) as EnrollmentRow | undefined;
    return row ? toEnrollment(row) : undefined;
}
export async function createEnrollment(userId: string, courseId: string, manual = true): Promise<void> {
    const res = (await getDb()
        .prepare('INSERT OR IGNORE INTO enrollments (id, user_id, course_id, enrolled_at, manual_access) VALUES (?,?,?,?,?)')
        .run(newId('enr'), userId, courseId, new Date().toISOString(), manual ? 1 : 0));
    if (manual) await getDb().prepare('UPDATE enrollments SET manual_access=1, blocked=0 WHERE user_id=? AND course_id=?').run(userId, courseId);
    if (res.changes > 0) {
        (await getDb().prepare('UPDATE courses SET total_enrollments = total_enrollments + 1 WHERE id = ?').run(courseId));
    }
}
export async function removeEnrollment(userId: string, courseId: string): Promise<void> {
    await getDb().prepare('UPDATE enrollments SET manual_access=0, blocked=1 WHERE user_id=? AND course_id=?').run(userId, courseId);
}
export async function touchEnrollment(userId: string, courseId: string, lessonId: string, at: string): Promise<void> {
    (await getDb()
        .prepare('UPDATE enrollments SET last_watched_lesson_id = ?, last_watched_at = ? WHERE user_id = ? AND course_id = ?')
        .run(lessonId, at, userId, courseId));
}
export async function setEnrollmentExpiry(userId: string, courseId: string, expiresAt: string | null): Promise<void> {
    (await getDb().prepare('UPDATE enrollments SET expires_at = ? WHERE user_id = ? AND course_id = ?').run(expiresAt, userId, courseId));
}
export async function completeEnrollment(userId: string, courseId: string, at: string): Promise<void> {
    (await getDb()
        .prepare('UPDATE enrollments SET completed_at = ? WHERE user_id = ? AND course_id = ? AND completed_at IS NULL')
        .run(at, userId, courseId));
}
