import type { LiveEvent } from '../domain/entities';
import { mockEvents } from '../infra/mockData';

export function listUpcomingEvents(limit?: number): LiveEvent[] {
  const now = Date.now();
  const future = mockEvents
    .filter((e) => new Date(e.startsAt).getTime() >= now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return limit ? future.slice(0, limit) : future;
}

export function getEventById(id: string): LiveEvent | undefined {
  return mockEvents.find((e) => e.id === id);
}

export function timeUntilEvent(event: LiveEvent): { days: number; hours: number; minutes: number; isLive: boolean } {
  const startMs = new Date(event.startsAt).getTime();
  const endMs = startMs + event.durationMinutes * 60_000;
  const now = Date.now();
  if (now >= startMs && now < endMs) return { days: 0, hours: 0, minutes: 0, isLive: true };
  const diff = Math.max(0, startMs - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return { days, hours, minutes, isLive: false };
}
