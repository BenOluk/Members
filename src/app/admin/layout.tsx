import Link from 'next/link';
import { requireAdmin } from '@/core/application/session';

function AdminLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors"
    >
      <span className="text-primary text-xs" aria-hidden>{icon}</span>
      {label}
    </Link>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-border bg-surface flex-shrink-0 sticky top-0 h-screen flex flex-col">
        <div className="p-5 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-primary" aria-hidden>△</span>
            <span className="text-sm font-heading font-semibold tracking-widest text-foreground uppercase">Sanctum</span>
          </Link>
          <p className="text-[10px] text-foreground-muted mt-1 uppercase tracking-widest">Grão-Mestre</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <AdminLink href="/admin" label="Visão geral" icon="◈" />
          <AdminLink href="/admin/cursos" label="Trilhas" icon="◇" />
          <AdminLink href="/admin/alunos" label="Membros" icon="◎" />
          <AdminLink href="/admin/espacos" label="Espaços" icon="▣" />
          <AdminLink href="/admin/eventos" label="Eventos" icon="◉" />
        </nav>
        <div className="p-4 border-t border-border">
          <Link href="/" className="text-xs text-foreground-muted hover:text-foreground transition-colors">
            ← Voltar ao Sanctum
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
