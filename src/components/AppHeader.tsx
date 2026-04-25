import Link from 'next/link';
import { getCurrentUser, isAdmin } from '@/core/application/session';
import { countUnread } from '@/core/application/notifications';
import { levelForXp } from '@/core/domain/levels';
import { Avatar } from './Avatar';

type NavKey = 'catalogo' | 'trilhas' | 'comunidade' | 'eventos' | 'perfil' | 'admin';

interface AppHeaderProps {
  active?: NavKey;
}

export function AppHeader({ active }: AppHeaderProps) {
  const user = getCurrentUser();
  const unread = countUnread(user.id);
  const level = levelForXp(user.xp);
  const admin = isAdmin(user);

  const navItem = (href: string, label: string, key: NavKey) => (
    <Link
      href={href}
      className={
        active === key
          ? 'text-foreground text-sm font-medium border-b border-primary pb-1'
          : 'text-foreground-muted text-sm hover:text-foreground transition-colors pb-1 border-b border-transparent'
      }
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border px-6 py-3.5 flex justify-between items-center">
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-primary text-lg leading-none glyph">✦</span>
          <span className="text-base font-heading font-semibold tracking-[0.15em] text-foreground">
            SANCTUM
          </span>
        </Link>
        <nav className="hidden md:flex gap-7">
          {navItem('/catalog', 'Catálogo', 'catalogo')}
          {navItem('/', 'Trilhas', 'trilhas')}
          {navItem('/community', 'Comunidade', 'comunidade')}
          {navItem('/events', 'Eventos', 'eventos')}
          {admin && navItem('/admin', 'Admin', 'admin')}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <form action="/search" className="hidden sm:block">
          <input
            type="search"
            name="q"
            placeholder="Buscar..."
            className="bg-surface border border-border rounded-sm px-3.5 py-1.5 text-sm w-48 focus:outline-none focus:border-primary/50 focus:w-64 transition-all placeholder:text-foreground-muted"
          />
        </form>

        <Link
          href="/notifications"
          className="relative text-foreground-muted hover:text-foreground transition-colors"
          aria-label={`Notificações (${unread} não lidas)`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-background text-[9px] font-bold min-w-[14px] h-3.5 px-1 rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </Link>

        <div className="hidden lg:flex flex-col text-right leading-tight">
          <span className="text-[11px] text-foreground-muted">{level.label}</span>
          <span className="text-[11px] text-primary font-medium">{user.xp.toLocaleString('pt-BR')} XP</span>
        </div>

        <Avatar user={user} size="md" ring linkToProfile />
      </div>
    </header>
  );
}
