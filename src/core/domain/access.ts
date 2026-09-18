import type { Course, Enrollment, User } from './entities';

export function enrollmentIsActive(enrollment: Enrollment | undefined, now = new Date().toISOString()): boolean {
  return Boolean(enrollment && (!enrollment.expiresAt || enrollment.expiresAt > now));
}

export function canStudy(user: User, course: Course, enrollment?: Enrollment): boolean {
  if (user.status === 'suspended') return false;
  if (user.role === 'admin') return true;
  return enrollmentIsActive(enrollment);
}

export function canSelfEnroll(user: User, course: Course): boolean {
  return user.status !== 'suspended' && course.isPublished && course.access === 'open';
}
