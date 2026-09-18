import type { LiveEvent } from '../domain/entities';
import * as eventsRepo from '../infra/repos/events';
export async function listAllEvents(): Promise<LiveEvent[]> {
    return (await eventsRepo.list());
}
export async function listUpcomingEvents(limit?: number): Promise<LiveEvent[]> {
    const now = Date.now();
    const future = (await eventsRepo.list()).filter((e) => new Date(e.startsAt).getTime() >= now);
    return limit ? future.slice(0, limit) : future;
}
export async function getEventById(id: string): Promise<LiveEvent | undefined> {
    return (await eventsRepo.getById(id));
}
export function timeUntilEvent(event: LiveEvent): {
    days: number;
    hours: number;
    minutes: number;
    isLive: boolean;
} {
    const startMs = new Date(event.startsAt).getTime();
    const endMs = startMs + event.durationMinutes * 60000;
    const now = Date.now();
    if (now >= startMs && now < endMs)
        return { days: 0, hours: 0, minutes: 0, isLive: true };
    const diff = Math.max(0, startMs - now);
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return { days, hours, minutes, isLive: false };
}
