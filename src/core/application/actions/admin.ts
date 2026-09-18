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
import { newSessionToken } from '@/core/infra/crypto';
import { validEmail, validPassword, safeUrl } from '@/core/domain/validation';
import { validateCourseDraft } from '@/core/domain/course-validation';
import { audit } from '@/core/infra/security';
import { transaction } from '@/core/infra/db';
function revalidateAll() {
    revalidatePath('/', 'layout');
}
// ---------- Cursos ----------------------------------------------------------
export async function saveCourse(draft: CourseDraft): Promise<{
    error?: string;
}> {
    const admin = await requireAdmin();
    const error = validateCourseDraft(draft);
    if (error)
        return { error };
    if (!(await coursesRepo.listCategories()).some((c) => c.id === draft.categoryId) || !(await usersRepo.getById(draft.instructorId)))
        return { error: 'Categoria ou instrutor inválidos.' };
    const existing = draft.id ? (await coursesRepo.getById(draft.id)) : undefined;
    if (draft.id && !existing)
        return { error: 'Trilha não encontrada.' };
    for (const draftModule of draft.modules) {
        if (draftModule.id && !existing?.modules.some((m) => m.id === draftModule.id))
            return { error: 'O módulo não pertence à trilha.' };
        for (const lesson of draftModule.lessons) {
            if (lesson.id && !existing?.modules.find((m) => m.id === draftModule.id)?.lessons.some((l) => l.id === lesson.id))
                return { error: 'A aula não pertence ao módulo.' };
        }
    }
    (await coursesRepo.save(draft));
    (await audit(admin.id, 'course.saved', draft.id ?? null));
    revalidateAll();
    redirect('/admin/cursos');
}
export async function deleteCourse(courseId: string): Promise<void> {
    await requireAdmin();
    (await coursesRepo.remove(courseId));
    revalidateAll();
}
export async function togglePublishCourse(courseId: string): Promise<void> {
    await requireAdmin();
    const course = (await coursesRepo.getById(courseId));
    if (!course)
        return;
    (await coursesRepo.setPublished(courseId, !course.isPublished));
    revalidateAll();
}
// ---------- Espaços ---------------------------------------------------------
export async function saveSpace(formData: FormData): Promise<void> {
    await requireAdmin();
    const id = String(formData.get('id') ?? '') || undefined;
    const name = String(formData.get('name') ?? '').trim();
    const visibility = String(formData.get('visibility') ?? 'members') as SpaceVisibility;
    if (!name || name.length > 150 || String(formData.get('description') ?? '').length > 5000 || String(formData.get('icon') ?? '').length > 20 || String(formData.get('categoryLabel') ?? '').length > 100 || !['public', 'members', 'premium'].includes(visibility))
        return;
    (await communityRepo.saveSpace({
        id,
        name,
        description: String(formData.get('description') ?? '').trim(),
        icon: String(formData.get('icon') ?? '').trim() || '⚫',
        visibility,
        categoryLabel: String(formData.get('categoryLabel') ?? '').trim() || 'Estudos',
    }));
    revalidateAll();
}
export async function deleteSpace(spaceId: string): Promise<void> {
    await requireAdmin();
    (await communityRepo.removeSpace(spaceId));
    revalidateAll();
}
// ---------- Eventos ---------------------------------------------------------
export async function saveEvent(formData: FormData): Promise<void> {
    const admin = await requireAdmin();
    const id = String(formData.get('id') ?? '') || undefined;
    const title = String(formData.get('title') ?? '').trim();
    const startsAtRaw = String(formData.get('startsAt') ?? '');
    const kind = String(formData.get('kind') ?? 'live') as EventKind;
    const joinUrl = String(formData.get('joinUrl') ?? '').trim();
    const coverImage = String(formData.get('coverImage') ?? '').trim() || '/course-cover.svg';
    const duration = Number(formData.get('durationMinutes') ?? 60);
    const maxAttendees = Number(formData.get('maxAttendees') ?? 0);
    if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(startsAtRaw) || !Number.isInteger(duration) || duration < 1 || duration > 1440 || !Number.isInteger(maxAttendees) || maxAttendees < 0 || String(formData.get('description') ?? '').length > 5000) return;
    if (!title || title.length > 200 || !startsAtRaw || !Number.isFinite(Date.parse(startsAtRaw)) || !['live', 'workshop', 'mentoria', 'ritual'].includes(kind) || (joinUrl && !safeUrl(joinUrl)) || !safeUrl(coverImage, true))
        return;
    (await eventsRepo.save({
        id,
        title,
        description: String(formData.get('description') ?? '').trim(),
        kind,
        coverImage,
        hostUserId: String(formData.get('hostUserId') ?? '') || admin.id,
        startsAt: new Date(`${startsAtRaw}-03:00`).toISOString(),
        durationMinutes: duration,
        joinUrl: joinUrl || '',
        maxAttendees: maxAttendees || undefined,
    }));
    revalidateAll();
}
export async function deleteEvent(eventId: string): Promise<void> {
    await requireAdmin();
    (await eventsRepo.remove(eventId));
    revalidateAll();
}
// ---------- Membros ---------------------------------------------------------
export async function createMember(formData: FormData): Promise<void> {
    const admin = await requireAdmin();
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');
    const role = String(formData.get('role') ?? 'student') as UserRole;
    if (!name || name.length > 100 || !validEmail(email) || (password && !validPassword(password)) || !['student', 'moderator', 'admin'].includes(role))
        redirect('/admin/alunos?status=invalido');
    if ((await usersRepo.emailExists(email)))
        redirect('/admin/alunos?status=existente');
    const handleBase = (String(formData.get('handle') ?? '').trim() || name)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9.]+/g, '.')
        .replace(/(^\.|\.$)/g, '');
    let handle = handleBase || email.split('@')[0];
    let i = 1;
    while ((await usersRepo.getByHandle(handle)))
        handle = `${handleBase}${++i}`;
    const member = (await usersRepo.create({
        name,
        email,
        handle,
        passwordHash: hashPassword(password || newSessionToken()),
        role,
    }));
    (await audit(admin.id, 'member.created', member.id));
    revalidatePath('/admin/alunos');
    redirect('/admin/alunos?status=criado');
}
export async function setUserRole(userId: string, formData: FormData): Promise<void> {
    const admin = await requireAdmin();
    if (userId === admin.id)
        return; // não rebaixa a si mesmo
    const role = String(formData.get('role') ?? '') as UserRole;
    if (!['student', 'moderator', 'admin'].includes(role))
        return;
    (await usersRepo.setRole(userId, role));
    revalidatePath('/admin/alunos');
}
export async function resetMemberPassword(userId: string, formData: FormData): Promise<void> {
    await requireAdmin();
    const password = String(formData.get('password') ?? '');
    if (!validPassword(password) || !(await usersRepo.getById(userId)))
        redirect('/admin/alunos?status=invalido');
    (await transaction(async () => (await usersRepo.setPassword(userId, hashPassword(password)))));
    revalidatePath('/admin/alunos');
}
export async function grantEnrollment(formData: FormData): Promise<void> {
    const admin = await requireAdmin();
    const userId = String(formData.get('userId') ?? '');
    const courseId = String(formData.get('courseId') ?? '');
    if (!(await usersRepo.getById(userId)) || !(await coursesRepo.getById(courseId)))
        return;
    const days = Number(formData.get('days') ?? 0);
    if (!Number.isInteger(days) || days < 0 || days > 36500)
        redirect('/admin/alunos?status=invalido');
    (await transaction(async () => {
        (await coursesRepo.createEnrollment(userId, courseId));
        (await coursesRepo.setEnrollmentExpiry(userId, courseId, days ? new Date(Date.now() + days * 86400000).toISOString() : null));
        (await audit(admin.id, 'enrollment.granted', `${userId}:${courseId}`));
    }));
    revalidateAll();
}
export async function revokeEnrollment(userId: string, courseId: string): Promise<void> {
    const admin = await requireAdmin();
    (await coursesRepo.removeEnrollment(userId, courseId));
    (await audit(admin.id, 'enrollment.revoked', `${userId}:${courseId}`));
    revalidateAll();
}
export async function toggleMemberStatus(userId: string): Promise<void> {
    const admin = await requireAdmin();
    if (admin.id === userId)
        return;
    const user = (await usersRepo.getById(userId));
    if (!user)
        return;
    (await transaction(async () => {
        (await usersRepo.setStatus(userId, user.status === 'suspended' ? 'active' : 'suspended'));
        (await audit(admin.id, 'member.status_changed', userId));
    }));
    revalidateAll();
}
