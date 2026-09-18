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
    live: '#c94f42',
    workshop: '#6b9fd4',
    mentoria: '#b08a3e',
    ritual: '#7b96c9',
};
interface EventCardProps {
    event: LiveEvent;
    variant?: 'list' | 'card';
}
function formatCountdown(t: ReturnType<typeof timeUntilEvent>): string {
    if (t.isLive)
        return 'AO VIVO';
    if (t.days > 0)
        return `em ${t.days}d ${t.hours}h`;
    if (t.hours > 0)
        return `em ${t.hours}h ${t.minutes}m`;
    return `em ${t.minutes}m`;
}
export async function EventCard({ event, variant = 'list' }: EventCardProps) {
    const host = (await getUserById(event.hostUserId));
    const t = timeUntilEvent(event);
    const accent = KIND_ACCENT[event.kind];
    const when = new Date(event.startsAt).toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
    if (variant === 'card') {
        return (<a href={event.joinUrl} className="group block rounded overflow-hidden border border-border bg-surface hover:border-primary/40 transition-colors duration-200">
        <div className="relative h-36">
          <Image src={event.coverImage} alt={event.title} fill className="object-cover opacity-75 group-hover:opacity-90 transition-opacity duration-300"/>
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent"/>
          <span className="absolute top-3 left-3 text-[10px] uppercase tracking-widest font-bold px-2 py-0.5" style={{ color: accent }}>
            {KIND_LABEL[event.kind]}
          </span>
          {t.isLive && (<span className="absolute top-3 right-3 text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 bg-destructive text-foreground animate-pulse">
              ● AO VIVO
            </span>)}
        </div>
        <div className="p-4">
          <h4 className="font-heading font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors duration-200 leading-snug">{event.title}</h4>
          <p className="text-[11px] text-foreground-muted mt-2">{when} · {event.durationMinutes} min</p>
          {host && <p className="text-[11px] text-foreground-muted mt-0.5">com {host.name}</p>}
        </div>
      </a>);
    }
    return (<a href={event.joinUrl} className="group flex items-center gap-3 p-3 rounded border border-border bg-surface hover:border-primary/40 transition-colors duration-200">
      <div className="flex flex-col items-center justify-center w-14 h-14 bg-background border border-border rounded flex-shrink-0">
        <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: accent }}>
          {KIND_LABEL[event.kind]}
        </span>
        <span className="text-xl font-heading font-bold text-foreground leading-none my-0.5">
          {new Date(event.startsAt).toLocaleDateString('pt-BR', { day: '2-digit', timeZone: 'America/Sao_Paulo' })}
        </span>
        <span className="text-[9px] text-foreground-muted uppercase">
          {new Date(event.startsAt).toLocaleDateString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' })}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-heading font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors duration-200">{event.title}</h4>
        <p className="text-[11px] text-foreground-muted mt-0.5 line-clamp-1">{event.description}</p>
        <div className="flex items-center gap-2.5 mt-1 text-[11px]">
          <span className="font-semibold" style={{ color: t.isLive ? '#c94f42' : 'var(--color-primary)' }}>
            {formatCountdown(t)}
          </span>
          <span className="text-foreground-muted">· {event.attendeeCount} inscritos</span>
        </div>
      </div>
    </a>);
}
