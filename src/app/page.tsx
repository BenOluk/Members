import Link from 'next/link';
import { requireUser } from '@/core/application/session';
import { getDashboardSnapshot } from '@/core/application/dashboard';
import { AppHeader } from '@/components/AppHeader';
import { CourseCard } from '@/components/CourseCard';
import { EventCard } from '@/components/EventCard';

export default async function DashboardPage() {
  const user = await requireUser();
  const snap = await getDashboardSnapshot(user);
  const continuing = snap.continueWatching[0];
  const allCourses = snap.byCategory.flatMap((entry) => entry.courses);
  return <><AppHeader user={user} active="trilhas"/><main className="page-shell">
    <section className="hero-grid">
      <div className="hero-copy"><p className="eyebrow">Biblioteca de estudos</p><h1 className="display-title">Conhecimento que encontra lugar na vida.</h1>
        <p className="text-foreground-muted max-w-xl mt-6">Bem-vindo, {user.name.split(' ')[0]}. Suas trilhas, anotações e encontros estão aqui. Retome o que começou ou abra um novo campo de estudo.</p>
        <div className="flex flex-wrap gap-3 mt-8"><Link className="button-primary" href={continuing ? `/course/${continuing.course.id}?l=${continuing.progress.nextLessonId ?? ''}` : '/meus-cursos'}>{continuing ? 'Retomar meus estudos' : 'Meus estudos'}</Link><Link className="button-secondary" href="/community">Entrar na Ordem</Link></div>
      </div>
      <div className="hero-aside">
        <p className="eyebrow">{continuing ? 'De onde você parou' : 'Seu espaço de estudo'}</p>
        {continuing ? <><h2 className="text-2xl">{continuing.course.title}</h2><p className="text-foreground-muted mt-3">{continuing.progress.completedLessons} de {continuing.progress.totalLessons} aulas concluídas</p><div className="h-1 bg-border mt-6" role="progressbar" aria-label="Progresso na trilha" aria-valuemin={0} aria-valuemax={100} aria-valuenow={continuing.progress.percentage}><div className="h-full bg-primary" style={{ width: `${continuing.progress.percentage}%` }}/></div><p className="text-sm mt-3 text-foreground-muted">{continuing.progress.percentage}% do percurso</p></>
          : <><h2 className="text-2xl">O estudo tem seu próprio ritmo.</h2><p className="text-foreground-muted mt-3">Cada aula concluída guarda seu progresso. Seu caderno acompanha você, de um aparelho para outro.</p></>}
        <div className="metric-row"><div><strong>{user.enrolledCourseIds.length}</strong><span>matrículas</span></div><div><strong>{user.completedLessonIds.length}</strong><span>aulas concluídas</span></div><div><strong>{user.xp}</strong><span>XP de estudo</span></div></div>
      </div>
    </section>
    {user.role === 'admin' && <section className="panel mt-8 flex flex-wrap items-center justify-between gap-4"><div><p>Prepare a casa para os membros.</p><p className="text-sm text-foreground-muted">Publique trilhas, vincule produtos da Hotmart e confira a operação.</p></div><Link href="/admin" className="button-secondary">Abrir administração</Link></section>}
    {snap.continueWatching.length > 0 && <section className="mt-20"><div className="section-heading"><span>↳</span><div><p className="eyebrow !mb-2">Retorno</p><h2>Continue seus estudos</h2></div><Link href="/meus-cursos" className="text-sm text-primary ml-auto">Ver todos</Link></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{snap.continueWatching.slice(0, 3).map(({ course, progress }) => <CourseCard key={course.id} course={course} progress={progress} variant="wide"/>)}</div></section>}
    <section className="mt-24"><div className="section-heading"><span>✦</span><div><p className="eyebrow !mb-2">Acervo</p><h2>Campos de estudo</h2></div></div>
      {!allCourses.length && <div className="panel"><p>As primeiras trilhas ainda estão sendo preparadas.</p><p className="text-foreground-muted mt-2">{user.role === 'admin' ? 'Cadastre seus cursos e publique quando o material estiver pronto.' : 'Seus novos estudos aparecerão aqui quando forem publicados.'}</p>{user.role === 'admin' && <Link className="button-primary mt-5" href="/admin/cursos/novo">Criar primeira trilha</Link>}</div>}
      <div className="space-y-16">{snap.byCategory.map(({ category, courses }) => <section key={category.id}><div className="mb-6"><p className="course-plate__meta">{category.label}</p><p className="text-sm text-foreground-muted mt-2">{category.description}</p></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{courses.map((course) => <CourseCard key={course.id} course={course} variant="wide"/>)}</div></section>)}</div>
    </section>
    {snap.upcomingEvents.length > 0 && <section className="mt-16 border-t border-border pt-10"><h2 className="text-2xl mb-6">Próximos encontros</h2><div className="grid md:grid-cols-3 gap-6">{snap.upcomingEvents.map((event) => <EventCard key={event.id} event={event} variant="card"/>)}</div></section>}
    <footer className="mt-16 border-t border-border pt-6 flex flex-wrap justify-between gap-4 text-sm text-foreground-muted"><p>Sanctum · O Polímata Hermético</p><Link href="/conta">Sua conta e seus dados</Link></footer>
  </main></>;
}
