'use server';
import { revalidatePath } from 'next/cache';
import * as notificationsRepo from '@/core/infra/repos/notifications';
import { requireUser } from '../session';
export async function markAllNotificationsRead(): Promise<void> {
    const user = await requireUser();
    (await notificationsRepo.markAllRead(user.id));
    revalidatePath('/notifications');
}
