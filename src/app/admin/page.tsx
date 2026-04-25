import Link from 'next/link';
import { listCourses } from '@/core/application/courses';
import { listUsers } from '@/core/application/users';

export default function AdminDashboard() {
  const courses = listCourses();
  const users = listUsers();
  const published = courses.filter((c) => c.isPublished).length;
  const enrollments = users.reduce((acc, u) => acc + u.enrolledCourseIds.length, 0);

  const stats = [
    { label: 'Cursos publicados', value: published },
    { label: 'Total de cursos', value: courses.length },
    { label: 'Membros', value: users.length },
    { label: 'Matrículas', value: enrollments },
  ];

  return (
    <div className="p-10">
      <div className="mb-10">
        <h1 className="text-2xl font-heading font-bold">Visão geral</h1>
        <p className="text-foreground-muted mt-1 text-sm">Controle central do Sanctum.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-sm p-5">
            <p className="text-3xl font-heading font-bold text-primary">{s.value}</p>
            <p className="text-xs text-foreground-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Link href="/admin/cursos" className="group p-6 border border-border rounded-sm bg-surface hover:border-primary/40 transition-colors">
          <span className="text-2xl text-primary">◇</span>
          <h3 className="text-base font-heading font-semibold mt-3 group-hover:text-primary transition-colors">Gerenciar Cursos</h3>
          <p className="text-sm text-foreground-muted mt-1">Criar, editar e publicar trilhas. Upload de vídeos e materiais.</p>
        </Link>
        <Link href="/admin/alunos" className="group p-6 border border-border rounded-sm bg-surface hover:border-primary/40 transition-colors">
          <span className="text-2xl text-primary">◎</span>
          <h3 className="text-base font-heading font-semibold mt-3 group-hover:text-primary transition-colors">Gerenciar Alunos</h3>
          <p className="text-sm text-foreground-muted mt-1">Ver membros, progresso e conceder acessos manualmente.</p>
        </Link>
      </div>
    </div>
  );
}
