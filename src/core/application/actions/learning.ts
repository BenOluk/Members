'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '../session';
import { enrollMember, finishLesson, saveNote } from '../learning';
export async function enroll(courseId: string): Promise<void> {
    const user = await requireUser();
    (await enrollMember(user.id, courseId));
    revalidatePath('/', 'layout');
}
export async function completeLesson(courseId: string, lessonId: string): Promise<void> {
    const user = await requireUser();
    (await finishLesson(user.id, courseId, lessonId));
    revalidatePath('/', 'layout');
}
export async function saveLessonNote(courseId: string, lessonId: string, form: FormData): Promise<void> {
    const user = await requireUser();
    const saved = await saveNote(user.id, courseId, lessonId, String(form.get('content') ?? ''));
    revalidatePath(`/course/${courseId}`);
    redirect(`/course/${encodeURIComponent(courseId)}?l=${encodeURIComponent(lessonId)}&nota=${saved ? 'salva' : 'erro'}#caderno`);
}
