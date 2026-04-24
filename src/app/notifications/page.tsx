import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { getCurrentUser } from '@/core/application/session';
import { listNotifications } from '@/core/application/notifications';
import type { NotificationKind } from '@/core/domain/entities';

const ICON: Record<NotificationKind, string> = {
  lesson_released: '🎬',
  comment_reply: '💬',
  mention: '@',
  event_soon: '🎙️',
  badge_earned: '🏅',
  certificate_issued: '📜',
};

function relative(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default function NotificationsPage() {
  const user = getCurrentUser();
  const list = listNotifications(user.id);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 py-10 pb-20">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Notificações</h1>
            <p className="text-foreground-muted text-sm mt-1">{list.length} no total</p>
          </div>
          <button className="text-sm text-primary hover:text-primary-hover">Marcar tudo como lido</button>
        </header>

        {list.length === 0 ? (
          <p className="text-foreground-muted text-center py-20">Caixa vazia. O silêncio também fala.</p>
        ) : (
          <ul className="space-y-2">
            {list.map((n) => {
              const body = (
                <div className={`flex items-start gap-4 p-4 rounded-md border ${n.read ? 'bg-surface border-border' : 'bg-primary/5 border-primary/30'}`}>
                  <span className="text-2xl leading-none">{ICON[n.kind]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{n.title}</p>
                    <p className="text-foreground-muted text-sm mt-0.5">{n.body}</p>
                  </div>
                  <span className="text-xs text-foreground-muted flex-shrink-0">{relative(n.createdAt)}</span>
                </div>
              );
              return <li key={n.id}>{n.href ? <Link href={n.href}>{body}</Link> : body}</li>;
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
