'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { CourseDraft, EventKind, SpaceVisibility, UserRole } from '@/core/domain/entities';
import { hashPassword } from '@/core/infra/crypto';
import * as communityRepo from '@/core/infra/repos/community';
import * as coursesRepo from '@/core/infra/repos/courses';
import * as eventsRepo from '@/core/infra/repos/events';
import * as usersRepo from '@/core/infra/repos/users';
import { requireAdmin } from '../session';

function revalidateAll() {
  revalidatePath('/', 'layout');
}

// ---------- Cursos ----------------------------------------------------------

export async function saveCourse(draft: CourseDraft): Promise<void> {
  await requireAdmin();
  if (!draft.title.trim()) return;
  coursesRepo.save(draft);
  revalidateAll();
  redirect('/admin/cursos');
}

export async function deleteCourse(courseId: string): Promise<void> {
  await requireAdmin();
  coursesRepo.remove(courseId);
  revalidateAll();
}

export async function togglePublishCourse(courseId: string): Promise<void> {
  await requireAdmin();
  const course = coursesRepo.getById(courseId);
  if (!course) return;
  coursesRepo.setPublished(courseId, !course.isPublished);
  revalidateAll();
}

// ---------- Espaços ---------------------------------------------------------

export async function saveSpace(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '') || undefined;
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  communityRepo.saveSpace({
    id,
    name,
    description: String(formData.get('description') ?? '').trim(),
    icon: String(formData.get('icon') ?? '').trim() || '⚫',
    visibility: (String(formData.get('visibility') ?? 'members') as SpaceVisibility),
    categoryLabel: String(formData.get('categoryLabel') ?? '').trim() || 'Estudos',
  });
  revalidateAll();
}

export async function deleteSpace(spaceId: string): Promise<void> {
  await requireAdmin();
  communityRepo.removeSpace(spaceId);
  revalidateAll();
}

// ---------- Eventos ---------------------------------------------------------

export async function saveEvent(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get('id') ?? '') || undefined;
  const title = String(formData.get('title') ?? '').trim();
  const startsAtRaw = String(formData.get('startsAt') ?? '');
  if (!title || !startsAtRaw) return;
  eventsRepo.save({
    id,
    title,
    description: String(formData.get('description') ?? '').trim(),
    kind: (String(formData.get('kind') ?? 'live') as EventKind),
    coverImage: String(formData.get('coverImage') ?? '').trim()
      || 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1200&auto=format&fit=crop',
    hostUserId: String(formData.get('hostUserId') ?? '') || admin.id,
    startsAt: new Date(startsAtRaw).toISOString(),
    durationMinutes: Number(formData.get('durationMinutes') ?? 60) || 60,
    joinUrl: String(formData.get('joinUrl') ?? '').trim() || '#',
    maxAttendees: Number(formData.get('maxAttendees')) || undefined,
  });
  revalidateAll();
}

export async function deleteEvent(eventId: string): Promise<void> {
  await requireAdmin();
  eventsRepo.remove(eventId);
  revalidateAll();
}

// ---------- Membros ---------------------------------------------------------

export async function createMember(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!name || !email || password.length < 8) return;
  if (usersRepo.emailExists(email)) return;

  const handleBase = (String(formData.get('handle') ?? '').trim() || name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9.]+/g, '.')
    .replace(/(^\.|\.$)/g, '');
  let handle = handleBase || email.split('@')[0];
  let i = 1;
  while (usersRepo.getByHandle(handle)) handle = `${handleBase}${++i}`;

  usersRepo.create({
    name,
    email,
    handle,
    passwordHash: hashPassword(password),
    role: (String(formData.get('role') ?? 'student') as UserRole),
  });
  revalidatePath('/admin/alunos');
}

export async function setUserRole(userId: string, formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (userId === admin.id) return; // não rebaixa a si mesmo
  const role = String(formData.get('role') ?? '') as UserRole;
  if (!['student', 'moderator', 'admin'].includes(role)) return;
  usersRepo.setRole(userId, role);
  revalidatePath('/admin/alunos');
}

export async function resetMemberPassword(userId: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const password = String(formData.get('password') ?? '');
  if (password.length < 8 || !usersRepo.getById(userId)) return;
  usersRepo.setPassword(userId, hashPassword(password));
  revalidatePath('/admin/alunos');
}

export async function grantEnrollment(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  const courseId = String(formData.get('courseId') ?? '');
  if (!usersRepo.getById(userId) || !coursesRepo.getById(courseId)) return;
  coursesRepo.createEnrollment(userId, courseId);
  revalidateAll();
}

export async function revokeEnrollment(userId: string, courseId: string): Promise<void> {
  await requireAdmin();
  coursesRepo.removeEnrollment(userId, courseId);
  revalidateAll();
}
