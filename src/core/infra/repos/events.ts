import type { EventKind, LiveEvent } from '@/core/domain/entities';
import { getDb, newId } from '../db';

interface EventRow {
  id: string;
  title: string;
  description: string;
  kind: string;
  cover_image: string;
  host_user_id: string;
  starts_at: string;
  duration_minutes: number;
  join_url: string;
  attendee_count: number;
  max_attendees: number | null;
}

function toEvent(row: EventRow): LiveEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    kind: row.kind as EventKind,
    coverImage: row.cover_image,
    hostUserId: row.host_user_id,
    startsAt: row.starts_at,
    durationMinutes: row.duration_minutes,
    joinUrl: row.join_url,
    attendeeCount: row.attendee_count,
    maxAttendees: row.max_attendees ?? undefined,
  };
}

export function list(): LiveEvent[] {
  const rows = getDb().prepare('SELECT * FROM events ORDER BY starts_at').all() as unknown as EventRow[];
  return rows.map(toEvent);
}

export function getById(id: string): LiveEvent | undefined {
  const row = getDb().prepare('SELECT * FROM events WHERE id = ?').get(id) as EventRow | undefined;
  return row ? toEvent(row) : undefined;
}

export function save(input: {
  id?: string;
  title: string;
  description: string;
  kind: EventKind;
  coverImage: string;
  hostUserId: string;
  startsAt: string;
  durationMinutes: number;
  joinUrl: string;
  maxAttendees?: number;
}): string {
  const db = getDb();
  if (input.id) {
    db.prepare(
      `UPDATE events SET title=?, description=?, kind=?, cover_image=?, host_user_id=?,
         starts_at=?, duration_minutes=?, join_url=?, max_attendees=? WHERE id=?`,
    ).run(input.title, input.description, input.kind, input.coverImage, input.hostUserId,
      input.startsAt, input.durationMinutes, input.joinUrl, input.maxAttendees ?? null, input.id);
    return input.id;
  }
  const id = newId('ev');
  db.prepare(
    `INSERT INTO events (id, title, description, kind, cover_image, host_user_id, starts_at,
       duration_minutes, join_url, attendee_count, max_attendees)
     VALUES (?,?,?,?,?,?,?,?,?,0,?)`,
  ).run(id, input.title, input.description, input.kind, input.coverImage, input.hostUserId,
    input.startsAt, input.durationMinutes, input.joinUrl, input.maxAttendees ?? null);
  return id;
}

export function remove(id: string): void {
  getDb().prepare('DELETE FROM events WHERE id = ?').run(id);
}
