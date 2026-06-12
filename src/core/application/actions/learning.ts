'use server';

import { revalidatePath } from 'next/cache';
import { advanceStreak } from '@/core/domain/streak';
import * as certificatesRepo from '@/core/infra/repos/certificates';
import * as coursesRepo from '@/core/infra/repos/courses';
import * as notificationsRepo from '@/core/infra/repos/notifications';
import * as usersRepo from '@/core/infra/repos/users';
import { allLessonsOfCourse, getCourseById } from '../courses';
import { requireUser } from '../session';

export async function enroll(courseId: string): Promise<void> {
  const user = await requireUser();
  const course = getCourseById(courseId);
  if (!course || (!course.isPublished && user.role !== 'admin')) return;
  coursesRepo.createEnrollment(user.id, courseId);
  revalidatePath(`/course/${courseId}`);
  revalidatePath('/');
}

export async function completeLesson(courseId: string, lessonId: string): Promise<void> {
  const user = await requireUser();
  const course = getCourseById(courseId);
  if (!course) return;
  const lessons = allLessonsOfCourse(course);
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) return;

  const now = new Date().toISOString();

  // Idempotente: segundo clique não duplica XP.
  const isNew = usersRepo.completeLesson(user.id, lessonId, now);
  if (!isNew) return;

  coursesRepo.createEnrollment(user.id, courseId); // garante matrícula
  coursesRepo.touchEnrollment(user.id, courseId, lessonId, now);
  usersRepo.addXp(user.id, lesson.xpReward);

  const streak = advanceStreak(user.streak, now);
  usersRepo.setStreak(user.id, streak.current, streak.longest, now);

  const award = (badgeId: string, title: string, body: string) => {
    if (usersRepo.awardBadge(user.id, badgeId, now)) {
      notificationsRepo.create({
        userId: user.id,
        kind: 'badge_earned',
        title,
        body,
        href: `/profile/${user.id}`,
      });
    }
  };

  if (usersRepo.countCompletedLessons(user.id) === 1) {
    award('b_primeiro_passo', 'Nova conquista: Primeiro Passo', 'Você completou sua primeira aula.');
  }
  if (streak.current >= 7) {
    award('b_constante', 'Nova conquista: Ritmo Constante', '7 dias seguidos de estudo.');
  }

  const completedAll = lessons.every(
    (l) => l.id === lessonId || user.completedLessonIds.includes(l.id),
  );
  if (completedAll && lessons.length > 0) {
    coursesRepo.completeEnrollment(user.id, courseId, now);
    award('b_iluminado', 'Nova conquista: Iluminado', `Trilha "${course.title}" concluída por inteiro.`);
    if (!certificatesRepo.exists(user.id, courseId)) {
      const cert = certificatesRepo.issue(user.id, courseId);
      notificationsRepo.create({
        userId: user.id,
        kind: 'certificate_issued',
        title: 'Certificado emitido',
        body: `Trilha "${course.title}" concluída. Credencial ${cert.credentialCode}.`,
        href: '/certificates',
      });
    }
  }

  revalidatePath(`/course/${courseId}`);
  revalidatePath('/');
}
