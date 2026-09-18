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
    <section className="grid lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-20 pb-12 border-b border-border items-center">
      <div><p className="eyebrow">Biblioteca de estudos</p><h1 className="display-title">Conhecimento que<br className="hidden sm:block"/> encontra lugar na vida.</h1>
        <p className="text-foreground-muted max-w-xl mt-6">Bem-vindo, {user.name.split(' ')[0]}. Suas trilhas, anotações e encontros estão aqui. Retome o que começou ou abra um novo campo de estudo.</p>
        <div className="flex flex-wrap gap-3 mt-8"><Link className="button-primary" href={continuing ? `/course/${continuing.course.id}?l=${continuing.progress.nextLessonId ?? ''}` : '/meus-cursos'}>{continuing ? 'Retomar meus estudos' : 'Meus estudos'}</Link><Link className="button-secondary" href="/community">Entrar na Ordem</Link></div>
      </div>
      <div className="panel !bg-transparent !p-8 lg:!p-10">
        <p className="eyebrow">{continuing ? 'De onde você parou' : 'Seu espaço de estudo'}</p>
        {continuing ? <><h2 className="text-2xl">{continuing.course.title}</h2><p className="text-foreground-muted mt-3">{continuing.progress.completedLessons} de {continuing.progress.totalLessons} aulas concluídas</p><div className="h-1 bg-border mt-6" role="progressbar" aria-label="Progresso na trilha" aria-valuemin={0} aria-valuemax={100} aria-valuenow={continuing.progress.percentage}><div className="h-full bg-primary" style={{ width: `${continuing.progress.percentage}%` }}/></div><p className="text-sm mt-3 text-foreground-muted">{continuing.progress.percentage}% do percurso</p></>
          : <><h2 className="text-2xl">O estudo tem seu próprio ritmo.</h2><p className="text-foreground-muted mt-3">Cada aula concluída guarda seu progresso. Seu caderno acompanha você, de um aparelho para outro.</p></>}
        <div className="grid grid-cols-3 gap-3 mt-8 pt-5 border-t border-border text-center"><div><p className="text-2xl">{user.enrolledCourseIds.length}</p><p className="text-xs text-foreground-muted">matrículas</p></div><div><p className="text-2xl">{user.completedLessonIds.length}</p><p className="text-xs text-foreground-muted">aulas concluídas</p></div><div><p className="text-2xl">{user.xp}</p><p className="text-xs text-foreground-muted">XP de estudo</p></div></div>
      </div>
    </section>
    {user.role === 'admin' && <section className="panel mt-8 flex flex-wrap items-center justify-between gap-4"><div><p>Prepare a casa para os membros.</p><p className="text-sm text-foreground-muted">Publique trilhas, vincule produtos da Hotmart e confira a operação.</p></div><Link href="/admin" className="button-secondary">Abrir administração</Link></section>}
    {snap.continueWatching.length > 0 && <section className="mt-14"><div className="flex justify-between gap-4 mb-6"><h2 className="text-2xl">Continue seus estudos</h2><Link href="/meus-cursos" className="text-sm text-primary">Ver todos</Link></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{snap.continueWatching.slice(0, 3).map(({ course, progress }) => <CourseCard key={course.id} course={course} progress={progress} variant="wide"/>)}</div></section>}
    <section className="mt-14"><p className="eyebrow">Acervo</p><h2 className="text-3xl mb-8">Campos de estudo</h2>
      {!allCourses.length && <div className="panel"><p>As primeiras trilhas ainda estão sendo preparadas.</p><p className="text-foreground-muted mt-2">{user.role === 'admin' ? 'Cadastre seus cursos e publique quando o material estiver pronto.' : 'Seus novos estudos aparecerão aqui quando forem publicados.'}</p>{user.role === 'admin' && <Link className="button-primary mt-5" href="/admin/cursos/novo">Criar primeira trilha</Link>}</div>}
      <div className="space-y-12">{snap.byCategory.map(({ category, courses }) => <section key={category.id}><div className="border-b border-border pb-3 mb-6"><h3 className="text-xl">{category.label}</h3><p className="text-sm text-foreground-muted">{category.description}</p></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{courses.map((course) => <CourseCard key={course.id} course={course} variant="wide"/>)}</div></section>)}</div>
    </section>
    {snap.upcomingEvents.length > 0 && <section className="mt-16 border-t border-border pt-10"><h2 className="text-2xl mb-6">Próximos encontros</h2><div className="grid md:grid-cols-3 gap-6">{snap.upcomingEvents.map((event) => <EventCard key={event.id} event={event} variant="card"/>)}</div></section>}
    <footer className="mt-16 border-t border-border pt-6 flex flex-wrap justify-between gap-4 text-sm text-foreground-muted"><p>Sanctum · O Polímata Hermético</p><Link href="/conta">Sua conta e seus dados</Link></footer>
  </main></>;
}
