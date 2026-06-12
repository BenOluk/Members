import { AppHeader } from '@/components/AppHeader';
import { EventCard } from '@/components/EventCard';
import { requireUser } from '@/core/application/session';
import { listUpcomingEvents } from '@/core/application/events';

export default async function EventsPage() {
  const user = await requireUser();
  const events = listUpcomingEvents();

  return (
    <div className="min-h-screen">
      <AppHeader user={user} active="eventos" />
      <main className="max-w-6xl mx-auto px-6 py-10 pb-20">
        <header className="mb-10">
          <h1 className="text-4xl font-heading font-bold">Calendário</h1>
          <p className="text-foreground-muted mt-2 max-w-2xl">
            Lives, mentorias, workshops e rituais ao vivo. Inscreva-se nos próximos encontros e acompanhe a Ordem em tempo real.
          </p>
        </header>

        {events.length === 0 ? (
          <p className="text-foreground-muted">Sem eventos futuros agendados.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((e) => <EventCard key={e.id} event={e} variant="card" />)}
          </div>
        )}
      </main>
    </div>
  );
}
