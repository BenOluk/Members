import Link from 'next/link';
import { requireAdmin } from '@/core/application/session';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const links = [['/admin', 'Visão geral'], ['/admin/cursos', 'Trilhas'], ['/admin/alunos', 'Membros'], ['/admin/espacos', 'Espaços'], ['/admin/eventos', 'Encontros'], ['/admin/integracoes', 'Hotmart'], ['/admin/operacao', 'Operação']];
  return <div className="admin-shell min-h-screen md:flex">
    <aside className="md:w-56 shrink-0 bg-surface border-b md:border-r border-border md:sticky top-0 md:h-screen">
      <div className="p-6 border-b border-border"><Link href="/" className="eyebrow !text-foreground">Sanctum</Link><p className="text-sm text-foreground-muted mt-2">Administração</p></div>
      <nav aria-label="Administração" className="flex overflow-x-auto md:flex-col gap-1 p-3">{links.map(([href, label]) => <Link key={href} href={href} className="whitespace-nowrap px-3 py-2 text-sm text-foreground-muted hover:text-foreground hover:bg-surface-hover">{label}</Link>)}</nav>
      <Link href="/" className="hidden md:block px-6 py-4 text-sm text-primary">Voltar aos estudos</Link>
    </aside>
    <main className="flex-1 min-w-0">{children}</main>
  </div>;
}
