import type { Course, CourseCategory, CourseProgress, Enrollment, Lesson, User, } from '../domain/entities';
import * as coursesRepo from '../infra/repos/courses';
import { enrollmentIsActive } from '../domain/access';
export async function listCategories(): Promise<CourseCategory[]> {
    return (await coursesRepo.listCategories());
}
export async function getCategoryById(id: string): Promise<CourseCategory | undefined> {
    return (await coursesRepo.listCategories()).find((c) => c.id === id);
}
/** Por padrão só trilhas publicadas (visão do aluno). */
export async function listCourses(opts?: {
    includeUnpublished?: boolean;
}): Promise<Course[]> {
    return (await coursesRepo.list(opts));
}
export async function getCourseById(courseId: string): Promise<Course | undefined> {
    return (await coursesRepo.getById(courseId));
}
export async function getCoursesByCategory(categoryId: string): Promise<Course[]> {
    return (await coursesRepo.list()).filter((c) => c.categoryId === categoryId);
}
export async function getFeaturedCourses(): Promise<Course[]> {
    return (await coursesRepo.list()).filter((c) => c.featured);
}
export async function getEnrollmentsForUser(userId: string): Promise<Enrollment[]> {
    return (await coursesRepo.getEnrollmentsForUser(userId));
}
export async function getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined> {
    return (await coursesRepo.getEnrollment(userId, courseId));
}
export function allLessonsOfCourse(course: Course): Lesson[] {
    return [...course.modules]
        .sort((a, b) => a.order - b.order)
        .flatMap((m) => [...m.lessons].sort((a, b) => a.order - b.order));
}
export function getLesson(course: Course, lessonId: string): Lesson | undefined {
    return allLessonsOfCourse(course).find((l) => l.id === lessonId);
}
export function getNextLesson(course: Course, lessonId: string): Lesson | undefined {
    const lessons = allLessonsOfCourse(course);
    const idx = lessons.findIndex((l) => l.id === lessonId);
    return idx >= 0 ? lessons[idx + 1] : undefined;
}
export function getPreviousLesson(course: Course, lessonId: string): Lesson | undefined {
    const lessons = allLessonsOfCourse(course);
    const idx = lessons.findIndex((l) => l.id === lessonId);
    return idx > 0 ? lessons[idx - 1] : undefined;
}
export function getCourseProgress(user: User, course: Course): CourseProgress {
    const lessons = allLessonsOfCourse(course);
    const completed = lessons.filter((l) => user.completedLessonIds.includes(l.id));
    const pct = lessons.length === 0 ? 0 : Math.round((completed.length / lessons.length) * 100);
    const next = lessons.find((l) => !user.completedLessonIds.includes(l.id));
    return {
        courseId: course.id,
        totalLessons: lessons.length,
        completedLessons: completed.length,
        percentage: pct,
        nextLessonId: next?.id ?? lessons[lessons.length - 1]?.id,
    };
}
export async function getContinueWatching(user: User): Promise<Array<{
    course: Course;
    progress: CourseProgress;
}>> {
    const enrolls = (await getEnrollmentsForUser(user.id)).filter((e) => !e.completedAt && enrollmentIsActive(e));
    return (await Promise.all(enrolls
        .sort((a, b) => (b.lastWatchedAt ?? '').localeCompare(a.lastWatchedAt ?? ''))
        .map(async (e) => {
        const course = (await getCourseById(e.courseId));
        if (!course)
            return undefined;
        return { course, progress: getCourseProgress(user, course) };
    }))).filter((x): x is {
        course: Course;
        progress: CourseProgress;
    } => Boolean(x));
}
export async function getEnrolledCourses(user: User): Promise<Array<{
    course: Course;
    progress: CourseProgress;
    enrollment: Enrollment;
}>> {
    return (await Promise.all((await getEnrollmentsForUser(user.id)).map(async (enrollment) => {
        const course = (await getCourseById(enrollment.courseId));
        if (!course)
            return undefined;
        return { course, progress: getCourseProgress(user, course), enrollment };
    }))).filter((x): x is NonNullable<typeof x> => Boolean(x));
}
export async function searchCourses(query: string): Promise<Course[]> {
    const q = query.trim().toLowerCase();
    if (!q)
        return [];
    return (await coursesRepo.list()).filter((c) => c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)));
}
