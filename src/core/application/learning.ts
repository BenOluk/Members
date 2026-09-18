import { canStudy, canSelfEnroll } from '../domain/access';
import { advanceStreak } from '../domain/streak';
import { getDb, transaction } from '../infra/db';
import * as courses from '../infra/repos/courses';
import * as users from '../infra/repos/users';
import * as certificates from '../infra/repos/certificates';
import * as notifications from '../infra/repos/notifications';
export async function enrollMember(userId: string, courseId: string): Promise<boolean> {
    return (await transaction(async () => {
        const user = (await users.getById(userId));
        const course = (await courses.getById(courseId));
        if (!user || !course || !canSelfEnroll(user, course))
            return false;
        (await courses.createEnrollment(userId, courseId));
        return true;
    }));
}
/** Conclusão, XP, conquista e certificado são gravados ou revertidos juntos. */
export async function finishLesson(userId: string, courseId: string, lessonId: string): Promise<boolean> {
    return (await transaction(async () => {
        const user = (await users.getById(userId));
        const course = (await courses.getById(courseId));
        if (!user || !course || !canStudy(user, course, (await courses.getEnrollment(userId, courseId))))
            return false;
        const lessons = course.modules.flatMap((m) => m.lessons);
        const lesson = lessons.find((l) => l.id === lessonId);
        if (!lesson)
            return false;
        const now = new Date().toISOString();
        if (!(await users.completeLesson(userId, lessonId, now)))
            return false;
        if (user.role === 'admin')
            (await courses.createEnrollment(userId, courseId));
        (await courses.touchEnrollment(userId, courseId, lessonId, now));
        (await users.addXp(userId, lesson.xpReward));
        const streak = advanceStreak(user.streak, now);
        (await users.setStreak(userId, streak.current, streak.longest, now));
        const award = async (id: string, title: string, body: string) => {
            if ((await users.awardBadge(userId, id, now)))
                (await notifications.create({ userId, kind: 'badge_earned', title, body, href: `/profile/${userId}` }));
        };
        if ((await users.countCompletedLessons(userId)) === 1)
            (await award('b_primeiro_passo', 'Primeira aula concluída', 'Seu primeiro registro de estudo.'));
        if (streak.current >= 7)
            (await award('b_constante', 'Ritmo constante', 'Sete dias seguidos de estudo.'));
        if (lessons.length && lessons.every((l) => l.id === lessonId || user.completedLessonIds.includes(l.id))) {
            (await courses.completeEnrollment(userId, courseId, now));
            (await award('b_iluminado', 'Trilha concluída', course.title));
            if (!(await certificates.exists(userId, courseId))) {
                (await certificates.issue(userId, courseId));
                (await notifications.create({ userId, kind: 'certificate_issued', title: 'Certificado disponível', body: course.title, href: '/certificates' }));
            }
        }
        return true;
    }));
}
export async function lessonNote(userId: string, lessonId: string): Promise<string> {
    const row = (await getDb().prepare('SELECT content FROM lesson_notes WHERE user_id = ? AND lesson_id = ?').get(userId, lessonId)) as {
        content: string;
    } | undefined;
    return row?.content ?? '';
}
export async function saveNote(userId: string, courseId: string, lessonId: string, content: string): Promise<boolean> {
    const user = (await users.getById(userId));
    const course = (await courses.getById(courseId));
    if (!user || !course || !canStudy(user, course, (await courses.getEnrollment(userId, courseId))) || content.length > 20000)
        return false;
    if (!course.modules.some((m) => m.lessons.some((l) => l.id === lessonId)))
        return false;
    (await getDb().prepare(`INSERT INTO lesson_notes (user_id, lesson_id, content, updated_at) VALUES (?,?,?,?)
    ON CONFLICT(user_id, lesson_id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`)
        .run(userId, lessonId, content.trim(), new Date().toISOString()));
    return true;
}
