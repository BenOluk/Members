import type {
  Course,
  CourseCategory,
  CourseProgress,
  Enrollment,
  Lesson,
  User,
} from '../domain/entities';
import {
  mockCategories,
  mockCourses,
  mockEnrollments,
} from '../infra/mockData';

export function listCategories(): CourseCategory[] {
  return mockCategories;
}

export function getCategoryById(id: string): CourseCategory | undefined {
  return mockCategories.find((c) => c.id === id);
}

export function listCourses(): Course[] {
  return mockCourses;
}

export function listPublishedCourses(): Course[] {
  return mockCourses.filter((c) => c.isPublished);
}

export function getCourseById(courseId: string): Course | undefined {
  return mockCourses.find((c) => c.id === courseId);
}

export function getCoursesByCategory(categoryId: string): Course[] {
  return mockCourses.filter((c) => c.categoryId === categoryId && c.isPublished);
}

export function getFeaturedCourses(): Course[] {
  return mockCourses.filter((c) => c.featured && c.isPublished);
}

export function getEnrollmentsForUser(userId: string): Enrollment[] {
  return mockEnrollments.filter((e) => e.userId === userId);
}

export function isEnrolled(user: User, courseId: string): boolean {
  return user.enrolledCourseIds.includes(courseId);
}

export function canAccessCourse(user: User, course: Course): boolean {
  if (user.role === 'admin') return true;
  if (course.isFree) return true;
  return isEnrolled(user, course.id);
}

export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function allLessonsOfCourse(course: Course): Lesson[] {
  return course.modules
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

export function getEnrolledCourses(user: User): Array<{ course: Course; progress: CourseProgress }> {
  return user.enrolledCourseIds
    .map((id) => getCourseById(id))
    .filter((c): c is Course => Boolean(c))
    .map((course) => ({ course, progress: getCourseProgress(user, course) }));
}

export function searchCourses(query: string): Course[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return mockCourses.filter(
    (c) =>
      c.isPublished &&
      (c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))),
  );
}

// ---------- Write operations (em prod: Supabase) -------------------------

export function adminCreateCourse(data: Omit<Course, 'id' | 'publishedAt' | 'totalEnrollments' | 'ratingAverage' | 'ratingCount'>): Course {
  const course: Course = {
    ...data,
    id: `course_${Date.now()}`,
    publishedAt: new Date().toISOString(),
    totalEnrollments: 0,
    ratingAverage: 0,
    ratingCount: 0,
  };
  mockCourses.push(course);
  return course;
}

export function adminUpdateCourse(id: string, data: Partial<Course>): Course | undefined {
  const idx = mockCourses.findIndex((c) => c.id === id);
  if (idx < 0) return undefined;
  mockCourses[idx] = { ...mockCourses[idx], ...data };
  return mockCourses[idx];
}

export function adminDeleteCourse(id: string): boolean {
  const idx = mockCourses.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  mockCourses.splice(idx, 1);
  return true;
}
