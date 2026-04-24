import type { AppNotification } from '../domain/entities';
import { mockNotifications } from '../infra/mockData';

export function listNotifications(userId: string): AppNotification[] {
  return mockNotifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function countUnread(userId: string): number {
  return listNotifications(userId).filter((n) => !n.read).length;
}
