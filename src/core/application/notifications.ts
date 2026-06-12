import type { AppNotification } from '../domain/entities';
import * as notificationsRepo from '../infra/repos/notifications';

export function listNotifications(userId: string): AppNotification[] {
  return notificationsRepo.listForUser(userId);
}

export function countUnread(userId: string): number {
  return notificationsRepo.countUnread(userId);
}
