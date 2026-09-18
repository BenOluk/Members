import type { AppNotification } from '../domain/entities';
import * as notificationsRepo from '../infra/repos/notifications';
export async function listNotifications(userId: string): Promise<AppNotification[]> {
    return (await notificationsRepo.listForUser(userId));
}
export async function countUnread(userId: string): Promise<number> {
    return (await notificationsRepo.countUnread(userId));
}
