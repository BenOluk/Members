import type { AppNotification, NotificationKind } from '@/core/domain/entities';
import { getDb, newId } from '../db';

interface NotificationRow {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string;
  href: string | null;
  read: number;
  created_at: string;
}

function toNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind as NotificationKind,
    title: row.title,
    body: row.body,
    href: row.href ?? undefined,
    read: row.read === 1,
    createdAt: row.created_at,
  };
}

export function listForUser(userId: string): AppNotification[] {
  const rows = getDb()
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as unknown as NotificationRow[];
  return rows.map(toNotification);
}

export function countUnread(userId: string): number {
  const row = getDb()
    .prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read = 0')
    .get(userId) as { n: number };
  return row.n;
}

export function markAllRead(userId: string): void {
  getDb().prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(userId);
}

export function create(input: {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
}): void {
  getDb()
    .prepare('INSERT INTO notifications (id, user_id, kind, title, body, href, read, created_at) VALUES (?,?,?,?,?,?,0,?)')
    .run(newId('n'), input.userId, input.kind, input.title, input.body, input.href ?? null, new Date().toISOString());
}
