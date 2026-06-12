import type { LiveEvent } from '@/core/domain/entities';
import { listAllEvents } from '@/core/application/events';
import { listUsers } from '@/core/application/users';
import { deleteEvent, saveEvent } from '@/core/application/actions/admin';

const inputCls =
  'bg-background border border-border rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:border-primary/60';
const labelCls = 'block text-[10px] uppercase tracking-widest font-bold text-foreground-muted mb-1';

function isPast(e: LiveEvent): boolean {
  return new Date(e.startsAt).getTime() + e.durationMinutes * 60_000 < Date.now();
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EventForm({ event, hosts }: { event?: LiveEvent; hosts: Array<{ id: string; name: string }> }) {
  const key = event?.id ?? 'new';
  return (
    <form action={saveEvent} className="grid md:grid-cols-3 gap-3 items-end">
      {event && <input type="hidden" name="id" value={event.id} />}
      <div className="md:col-span-2">
        <label className={labelCls} htmlFor={`ev-title-${key}`}>Título</label>
        <input id={`ev-title-${key}`} name="title" required defaultValue={event?.title ?? ''} className={`${inputCls} w-full`} />
      </div>
      <div>
        <label className={labelCls} htmlFor={`ev-kind-${key}`}>Tipo</label>
        <select id={`ev-kind-${key}`} name="kind" defaultValue={event?.kind ?? 'live'} className={`${inputCls} w-full`}>
          <option value="live">Live</option>
          <option value="workshop">Workshop</option>
          <option value="mentoria">Mentoria</option>
          <option value="ritual">Ritual</option>
        </select>
      </div>
      <div className="md:col-span-3">
        <label className={labelCls} htmlFor={`ev-desc-${key}`}>Descrição</label>
        <input id={`ev-desc-${key}`} name="description" defaultValue={event?.description ?? ''} className={`${inputCls} w-full`} />
      </div>
      <div>
        <label className={labelCls} htmlFor={`ev-start-${key}`}>Início</label>
        <input
          id={`ev-start-${key}`}
          name="startsAt"
          type="datetime-local"
          required
          defaultValue={event ? toLocalInput(event.startsAt) : ''}
          className={`${inputCls} w-full`}
        />
      </div>
      <div>
        <label className={labelCls} htmlFor={`ev-dur-${key}`}>Duração (min)</label>
        <input id={`ev-dur-${key}`} name="durationMinutes" type="number" min={15} defaultValue={event?.durationMinutes ?? 60} className={`${inputCls} w-full`} />
      </div>
      <div>
        <label className={labelCls} htmlFor={`ev-host-${key}`}>Anfitrião</label>
        <select id={`ev-host-${key}`} name="hostUserId" defaultValue={event?.hostUserId ?? hosts[0]?.id} className={`${inputCls} w-full`}>
          {hosts.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className={labelCls} htmlFor={`ev-url-${key}`}>Link de acesso</label>
        <input id={`ev-url-${key}`} name="joinUrl" defaultValue={event?.joinUrl ?? ''} placeholder="https://..." className={`${inputCls} w-full`} />
      </div>
      <div>
        <label className={labelCls} htmlFor={`ev-max-${key}`}>Vagas (opcional)</label>
        <input id={`ev-max-${key}`} name="maxAttendees" type="number" min={1} defaultValue={event?.maxAttendees ?? ''} className={`${inputCls} w-full`} />
      </div>
      <div className="md:col-span-3">
        <button type="submit" className="bg-primary text-background font-bold px-5 py-1.5 rounded-sm hover:bg-primary-hover transition-colors text-xs">
          {event ? 'Salvar' : 'Criar evento'}
        </button>
      </div>
    </form>
  );
}

export default function AdminEventsPage() {
  const events = listAllEvents();
  const hosts = listUsers()
    .filter((u) => u.role !== 'student')
    .map((u) => ({ id: u.id, name: u.name }));

  return (
    <div className="p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold">Eventos</h1>
        <p className="text-foreground-muted mt-1 text-sm">{events.length} eventos registrados.</p>
      </div>

      <div className="mb-8 bg-surface border border-border rounded-md p-5">
        <h2 className="text-sm font-semibold text-primary mb-4">+ Novo evento</h2>
        <EventForm hosts={hosts} />
      </div>

      <div className="space-y-3">
        {events.map((e) => {
          const past = isPast(e);
          return (
            <div key={e.id} className={`bg-surface border border-border rounded-md p-5 ${past ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold">
                  {e.title}
                  <span className="text-foreground-muted font-normal ml-2 text-xs">
                    {new Date(e.startsAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {past ? ' • encerrado' : ''} • {e.attendeeCount} inscritos
                  </span>
                </p>
                <form action={deleteEvent.bind(null, e.id)}>
                  <button
                    type="submit"
                    className="text-xs border border-destructive/40 px-3 py-1.5 rounded-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Excluir
                  </button>
                </form>
              </div>
              <EventForm event={e} hosts={hosts} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
