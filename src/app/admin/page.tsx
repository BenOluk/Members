import Link from 'next/link';
import { requireAdmin } from '@/core/application/session';
import { listCourses } from '@/core/application/courses';
import { listUsers } from '@/core/application/users';
import { listPosts } from '@/core/application/community';
import { listUpcomingEvents } from '@/core/application/events';
export default async function AdminDashboard() {
    await requireAdmin();
    const courses = (await listCourses({ includeUnpublished: true }));
    const users = (await listUsers());
    const posts = (await listPosts());
    const events = (await listUpcomingEvents());
    const published = courses.filter((c) => c.isPublished).length;
    const enrollments = users.reduce((acc, u) => acc + u.enrolledCourseIds.length, 0);
    const completedLessons = users.reduce((acc, u) => acc + u.completedLessonIds.length, 0);
    const stats = [
        { label: 'Membros', value: users.length },
        { label: 'Trilhas publicadas', value: `${published}/${courses.length}` },
        { label: 'Matrículas', value: enrollments },
        { label: 'Aulas concluídas', value: completedLessons },
        { label: 'Posts na Ordem', value: posts.length },
        { label: 'Eventos futuros', value: events.length },
    ];
    const sections = [
        { href: '/admin/cursos', icon: '◇', title: 'Trilhas', desc: 'Criar, editar e publicar trilhas, módulos e aulas.' },
        { href: '/admin/alunos', icon: '◎', title: 'Membros', desc: 'Contas, papéis, matrículas e senhas.' },
        { href: '/admin/espacos', icon: '▣', title: 'Espaços', desc: 'Os círculos da Ordem: criar, editar, restringir.' },
        { href: '/admin/eventos', icon: '◉', title: 'Eventos', desc: 'Lives, mentorias, workshops e rituais.' },
    ];
    return (<div className="p-10">
      <div className="mb-10">
        <h1 className="text-2xl font-heading font-bold">Visão geral</h1>
        <p className="text-foreground-muted mt-1 text-sm">Controle central do Sanctum.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-12">
        {stats.map((s) => (<div key={s.label} className="bg-surface border border-border rounded-sm p-5">
            <p className="text-3xl font-heading font-bold text-primary">{s.value}</p>
            <p className="text-xs text-foreground-muted mt-1">{s.label}</p>
          </div>))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {sections.map((s) => (<Link key={s.href} href={s.href} className="group p-6 border border-border rounded-sm bg-surface hover:border-primary/40 transition-colors">
            <span className="text-2xl text-primary" aria-hidden>{s.icon}</span>
            <h3 className="text-base font-heading font-semibold mt-3 group-hover:text-primary transition-colors">{s.title}</h3>
            <p className="text-sm text-foreground-muted mt-1">{s.desc}</p>
          </Link>))}
      </div>
    </div>);
}
