import Image from 'next/image';
import type { LiveEvent } from '@/core/domain/entities';
import { getUserById } from '@/core/application/users';
import { timeUntilEvent } from '@/core/application/events';

const KIND_LABEL: Record<LiveEvent['kind'], string> = {
  live: 'Live',
  workshop: 'Workshop',
  mentoria: 'Mentoria',
  ritual: 'Ritual',
};

const KIND_ACCENT: Record<LiveEvent['kind'], string> = {
  live: '#e8594c',
  workshop: '#7bb3ff',
  mentoria: '#d4af37',
  ritual: '#a076d9',
};

interface EventCardProps {
  event: LiveEvent;
  variant?: 'list' | 'card';
}

function formatCountdown(t: ReturnType<typeof timeUntilEvent>): string {
  if (t.isLive) return 'AO VIVO';
  if (t.days > 0) return `em ${t.days}d ${t.hours}h`;
  if (t.hours > 0) return `em ${t.hours}h ${t.minutes}m`;
  return `em ${t.minutes}m`;
}

export function EventCard({ event, variant = 'list' }: EventCardProps) {
  const host = getUserById(event.hostUserId);
  const t = timeUntilEvent(event);
  const accent = KIND_ACCENT[event.kind];
  const when = new Date(event.startsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (variant === 'card') {
    return (
      <a href={event.joinUrl} className="group block rounded-lg overflow-hidden border border-border bg-surface hover:border-primary/60 transition-colors">
        <div className="relative h-36">
          <Image src={event.coverImage} alt={event.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
          <span className="absolute top-3 left-3 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm bg-background/70 backdrop-blur" style={{ color: accent }}>
            {KIND_LABEL[event.kind]}
          </span>
          {t.isLive && <span className="absolute top-3 right-3 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm bg-[#e8594c] text-white animate-pulse">● AO VIVO</span>}
        </div>
        <div className="p-4">
          <h4 className="font-heading font-semibold line-clamp-2 group-hover:text-primary transition-colors">{event.title}</h4>
          <p className="text-xs text-foreground-muted mt-2">{when} • {event.durationMinutes} min</p>
          {host && <p className="text-xs text-foreground-muted mt-1">com {host.name}</p>}
        </div>
      </a>
    );
  }

  return (
    <a href={event.joinUrl} className="group flex items-center gap-4 p-3 rounded-md border border-border bg-surface hover:border-primary/60 transition-colors">
      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-md bg-background border border-border flex-shrink-0">
        <span className="text-[10px] uppercase font-bold" style={{ color: accent }}>{KIND_LABEL[event.kind]}</span>
        <span className="text-lg font-heading font-bold text-foreground">{new Date(event.startsAt).getDate()}</span>
        <span className="text-[10px] text-foreground-muted uppercase">{new Date(event.startsAt).toLocaleDateString('pt-BR', { month: 'short' })}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-heading font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{event.title}</h4>
        <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1">{event.description}</p>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-foreground-muted">
          <span className="text-primary font-medium">{formatCountdown(t)}</span>
          <span>• {event.attendeeCount} inscritos</span>
        </div>
      </div>
    </a>
  );
}
