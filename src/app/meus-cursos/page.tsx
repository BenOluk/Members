import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { CourseCard } from '@/components/CourseCard';
import { requireUser } from '@/core/application/session';
import { getEnrolledCourses } from '@/core/application/courses';

export default async function MeusCursosPage() {
  const user = await requireUser();
  const enrolled = await getEnrolledCourses(user);
  const inProgress = enrolled.filter((entry) => !entry.enrollment.completedAt);
  const completed = enrolled.filter((entry) => entry.enrollment.completedAt);

  return <div className="min-h-screen">
    <AppHeader user={user} active="meus-cursos"/>
    <main className="page-shell max-w-7xl">
      <header className="mb-16 max-w-3xl">
        <p className="eyebrow">Caderno de percurso</p>
        <h1 className="display-title">Meus estudos</h1>
        <p className="text-foreground-muted mt-5">{enrolled.length} trilhas — {completed.length} concluídas, {inProgress.length} em andamento.</p>
      </header>

      {enrolled.length === 0 && <div className="folio p-10 max-w-3xl">
        <p className="text-xl">Seu caderno ainda está em branco.</p>
        <p className="text-foreground-muted mt-2">Quando uma trilha for aberta para você, ela encontrará lugar aqui.</p>
        <Link href="/" className="button-secondary mt-6">Explorar a biblioteca</Link>
      </div>}

      {inProgress.length > 0 && <section className="mb-20">
        <div className="section-heading"><span>↳</span><div><p className="eyebrow !mb-2">Em curso</p><h2>Em andamento</h2></div></div>
        <div className="grid sm:grid-cols-2 gap-6">{inProgress.map(({ course, progress }) => <CourseCard key={course.id} course={course} progress={progress}/>)}</div>
      </section>}

      {completed.length > 0 && <section>
        <div className="section-heading"><span>✦</span><div><p className="eyebrow !mb-2">Arquivo</p><h2>Concluídas</h2></div></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{completed.map(({ course, enrollment }) => <Link key={course.id} href={`/course/${course.id}`} className="folio p-6 hover:border-primary/45 transition-colors">
          <p className="course-plate__meta">Trilha concluída</p><h3 className="text-xl mt-3">{course.title}</h3><p className="text-sm text-foreground-muted mt-2">{course.subtitle}</p>
          {enrollment.completedAt && <p className="text-xs text-foreground-muted mt-6">Concluída em {new Date(enrollment.completedAt).toLocaleDateString('pt-BR')}</p>}
        </Link>)}</div>
      </section>}
    </main>
  </div>;
}
