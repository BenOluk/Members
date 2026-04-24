import Link from 'next/link';
import { getCurrentUser } from '@/core/application/session';
import { countUnread } from '@/core/application/notifications';
import { levelForXp } from '@/core/domain/levels';
import { Avatar } from './Avatar';

interface AppHeaderProps {
  active?: 'trilhas' | 'comunidade' | 'eventos' | 'perfil';
}

export function AppHeader({ active }: AppHeaderProps) {
  const user = getCurrentUser();
  const unread = countUnread(user.id);
  const level = levelForXp(user.xp);

  const navItem = (href: string, label: string, key: AppHeaderProps['active']) => (
    <Link
      href={href}
      className={
        active === key
          ? 'text-foreground font-semibold border-b-2 border-primary pb-1'
          : 'text-foreground-muted hover:text-foreground transition-colors pb-1 border-b-2 border-transparent'
      }
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-6 py-3 flex justify-between items-center">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl leading-none">✦</span>
          <h1 className="text-lg font-heading font-bold text-primary tracking-wider">
            POLÍMATA <span className="text-foreground">HERMÉTICO</span>
          </h1>
        </Link>
        <nav className="hidden md:flex gap-6 text-sm">
          {navItem('/', 'Trilhas', 'trilhas')}
          {navItem('/community', 'A Ordem', 'comunidade')}
          {navItem('/events', 'Eventos', 'eventos')}
          {navItem(`/profile/${user.id}`, 'Perfil', 'perfil')}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <form action="/search" className="hidden sm:block">
          <input
            type="search"
            name="q"
            placeholder="Buscar cursos, pessoas, posts..."
            className="bg-surface border border-border rounded-full px-4 py-1.5 text-sm w-64 focus:outline-none focus:border-primary/60 focus:w-80 transition-all"
          />
        </form>

        <Link
          href="/notifications"
          className="relative text-foreground-muted hover:text-foreground transition-colors"
          aria-label={`Notificações (${unread} não lidas)`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-background text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </Link>

        <div className="hidden lg:flex flex-col text-right">
          <span className="text-xs text-foreground-muted">{level.label}</span>
          <span className="text-xs text-primary">{user.xp.toLocaleString('pt-BR')} XP</span>
        </div>

        <Avatar user={user} size="md" ring linkToProfile />
      </div>
    </header>
  );
}
