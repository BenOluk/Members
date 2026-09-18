import Link from 'next/link';
import type { User } from '@/core/domain/entities';
import { countUnread } from '@/core/application/notifications';
import { logout } from '@/core/application/actions/auth';

export async function AppHeader({ user, active }: { user: User; active?: 'trilhas' | 'meus-cursos' | 'comunidade' | 'eventos' | 'perfil' }) {
  const unread = await countUnread(user.id);
  const links = [
    { href: '/', label: 'Biblioteca', key: 'trilhas' },
    { href: '/meus-cursos', label: 'Meus estudos', key: 'meus-cursos' },
    { href: '/community', label: 'A Ordem', key: 'comunidade' },
    { href: '/events', label: 'Encontros', key: 'eventos' },
  ];
  return <>
    <header className="sticky top-0 z-50 border-b border-primary/15 bg-background/90 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 min-h-20 flex items-center justify-between gap-5">
        <Link href="/" className="shrink-0 flex items-center gap-4"><span className="text-primary text-2xl" aria-hidden>△</span><span><span className="eyebrow !mb-0 !text-foreground !text-sm block">Sanctum</span><span className="hidden lg:block text-[10px] text-foreground-muted tracking-[.14em] mt-1">O Polímata Hermético</span></span></Link>
        <nav aria-label="Principal" className="hidden md:flex items-center gap-5 lg:gap-8">{links.map((link) => <Link key={link.href} href={link.href} aria-current={active === link.key ? 'page' : undefined} className={active === link.key ? 'text-primary text-sm border-b border-primary pb-1' : 'text-sm text-foreground-muted hover:text-foreground pb-1 border-b border-transparent'}>{link.label}</Link>)}</nav>
        <div className="flex items-center gap-4">
          <Link href="/search" aria-label="Buscar" className="text-foreground-muted hover:text-primary"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></Link>
          <Link href="/notifications" className="text-sm text-foreground-muted" aria-label={`Notificações: ${unread} não lidas`}>{unread ? `Avisos (${unread})` : 'Avisos'}</Link>
          <details className="relative">
            <summary className="list-none cursor-pointer w-10 h-10 rounded-full border border-primary/25 grid place-items-center text-primary font-heading" aria-label="Menu da conta">{user.name.slice(0, 1)}</summary>
            <nav aria-label="Conta" className="absolute right-0 top-14 min-w-56 panel !p-4 shadow-xl flex flex-col gap-3">
              <span className="text-sm text-foreground-muted truncate max-w-52">{user.name}</span>
              <Link href="/conta">Minha conta</Link><Link href={`/profile/${user.id}`}>Meu perfil</Link><Link href="/certificates">Certificados</Link>
              {user.role === 'admin' && <Link href="/admin" className="text-primary">Administração</Link>}
              <form action={logout}><button className="text-left w-full border-t border-border pt-3">Sair</button></form>
            </nav>
          </details>
        </div>
      </div>
    </header>
    <nav aria-label="Navegação no celular" className="mobile-nav">{links.map((link) => <Link key={link.href} href={link.href} aria-current={active === link.key ? 'page' : undefined} className={active === link.key ? 'text-primary' : 'text-foreground-muted'}>{link.label}</Link>)}<Link href="/conta">Conta</Link></nav>
  </>;
}
