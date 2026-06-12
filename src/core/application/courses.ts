import type {
  Course,
  CourseCategory,
  CourseProgress,
  Enrollment,
  Lesson,
  User,
} from '../domain/entities';
import * as coursesRepo from '../infra/repos/courses';

export function listCategories(): CourseCategory[] {
  return coursesRepo.listCategories();
}

export function getCategoryById(id: string): CourseCategory | undefined {
  return coursesRepo.listCategories().find((c) => c.id === id);
}

/** Por padrão só trilhas publicadas (visão do aluno). */
export function listCourses(opts?: { includeUnpublished?: boolean }): Course[] {
  return coursesRepo.list(opts);
}

export function getCourseById(courseId: string): Course | undefined {
  return coursesRepo.getById(courseId);
}

export function getCoursesByCategory(categoryId: string): Course[] {
  return coursesRepo.list().filter((c) => c.categoryId === categoryId);
}

export function getFeaturedCourses(): Course[] {
  return coursesRepo.list().filter((c) => c.featured);
}

export function getEnrollmentsForUser(userId: string): Enrollment[] {
  return coursesRepo.getEnrollmentsForUser(userId);
}

export function getEnrollment(userId: string, courseId: string): Enrollment | undefined {
  return coursesRepo.getEnrollment(userId, courseId);
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

export function getContinueWatching(user: User): Array<{ course: Course; progress: CourseProgress }> {
  const enrolls = getEnrollmentsForUser(user.id).filter((e) => !e.completedAt);
  return enrolls
    .sort((a, b) => (b.lastWatchedAt ?? '').localeCompare(a.lastWatchedAt ?? ''))
    .map((e) => {
      const course = getCourseById(e.courseId);
      if (!course) return undefined;
      return { course, progress: getCourseProgress(user, course) };
    })
    .filter((x): x is { course: Course; progress: CourseProgress } => Boolean(x));
}

export function getEnrolledCourses(user: User): Array<{ course: Course; progress: CourseProgress; enrollment: Enrollment }> {
  return getEnrollmentsForUser(user.id)
    .map((enrollment) => {
      const course = getCourseById(enrollment.courseId);
      if (!course) return undefined;
      return { course, progress: getCourseProgress(user, course), enrollment };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
}

export function searchCourses(query: string): Course[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return coursesRepo.list().filter((c) =>
    c.title.toLowerCase().includes(q) ||
    c.subtitle.toLowerCase().includes(q) ||
    c.description.toLowerCase().includes(q) ||
    c.tags.some((t) => t.toLowerCase().includes(q)),
  );
}
