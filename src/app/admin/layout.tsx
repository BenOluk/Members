import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, isAdmin } from '@/core/application/session';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (!isAdmin(user)) redirect('/');

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border bg-surface flex-shrink-0 sticky top-0 h-screen flex flex-col">
        <div className="p-5 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-primary glyph">✦</span>
            <span className="text-sm font-heading font-semibold tracking-widest text-foreground">SANCTUM</span>
          </Link>
          <p className="text-[10px] text-foreground-muted mt-1 uppercase tracking-widest">Admin</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <AdminLink href="/admin" label="Visão geral" icon="◈" />
          <AdminLink href="/admin/cursos" label="Cursos" icon="◇" />
          <AdminLink href="/admin/alunos" label="Alunos" icon="◎" />
        </nav>
        <div className="p-4 border-t border-border">
          <Link href="/" className="text-xs text-foreground-muted hover:text-foreground transition-colors">
            ← Voltar ao site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function AdminLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors"
    >
      <span className="text-primary text-xs">{icon}</span>
      {label}
    </Link>
  );
}
