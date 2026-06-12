import Link from 'next/link';
import type { User } from '@/core/domain/entities';
import { countUnread } from '@/core/application/notifications';
import { isAdmin } from '@/core/application/session';
import { logout } from '@/core/application/actions/auth';
import { levelForXp } from '@/core/domain/levels';
import { Avatar } from './Avatar';

interface AppHeaderProps {
  user: User;
  active?: 'trilhas' | 'meus-cursos' | 'comunidade' | 'eventos' | 'perfil';
}

export function AppHeader({ user, active }: AppHeaderProps) {
  const unread = countUnread(user.id);
  const level = levelForXp(user.xp);

  const navItem = (href: string, label: string, key: AppHeaderProps['active']) => {
    const isActive = active === key;
    return (
      <Link
        href={href}
        className={
          isActive
            ? 'text-sm font-semibold text-foreground flex items-center gap-1.5'
            : 'text-sm text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1.5'
        }
      >
        {isActive && (
          <span className="block w-1 h-1 rounded-full bg-primary" aria-hidden />
        )}
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-6 py-3.5 flex justify-between items-center">
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-primary text-lg leading-none font-heading" aria-hidden>△</span>
          <span className="text-sm font-heading font-bold tracking-[0.18em] text-foreground uppercase">
            Sanctum
          </span>
        </Link>
        <nav className="hidden md:flex gap-7">
          {navItem('/', 'Trilhas', 'trilhas')}
          {navItem('/meus-cursos', 'Minha jornada', 'meus-cursos')}
          {navItem('/community', 'Ordem', 'comunidade')}
          {navItem('/events', 'Eventos', 'eventos')}
        </nav>
      </div>

      <div className="flex items-center gap-5">
        <form action="/search" className="hidden sm:block">
          <input
            type="search"
            name="q"
            placeholder="Buscar trilhas, membros..."
            className="bg-surface border border-border rounded px-3.5 py-1.5 text-sm w-52 focus:outline-none focus:border-primary/50 focus:w-72 transition-all placeholder:text-foreground-muted/50"
          />
        </form>

        {isAdmin(user) && (
          <Link
            href="/admin"
            className="hidden sm:block text-[10px] uppercase tracking-widest font-bold text-primary border border-primary/30 hover:border-primary/70 px-2.5 py-1 rounded-sm transition-colors"
          >
            Admin
          </Link>
        )}

        <Link
          href="/notifications"
          className="relative text-foreground-muted hover:text-foreground transition-colors"
          aria-label={`Notificações${unread > 0 ? ` (${unread} não lidas)` : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-background text-[9px] font-bold min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center leading-none">
              {unread}
            </span>
          )}
        </Link>

        <div className="hidden lg:flex flex-col items-end">
          <span className="text-[11px] font-semibold text-foreground leading-none">{level.label}</span>
          <span className="text-[10px] text-foreground-muted mt-0.5">{user.xp.toLocaleString('pt-BR')} XP</span>
        </div>

        <Avatar user={user} size="md" ring linkToProfile />

        <form action={logout}>
          <button
            type="submit"
            className="text-foreground-muted hover:text-foreground transition-colors"
            aria-label="Sair da conta"
            title="Sair"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </form>
      </div>
    </header>
  );
}
