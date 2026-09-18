import Link from 'next/link';
import Image from 'next/image';
import { AppHeader } from '@/components/AppHeader';
import { requireUser } from '@/core/application/session';
import { getEnrolledCourses } from '@/core/application/courses';
export default async function MeusCursosPage() {
    const user = await requireUser();
    const enrolled = (await getEnrolledCourses(user));
    const inProgress = enrolled.filter((e) => !e.enrollment.completedAt);
    const completed = enrolled.filter((e) => e.enrollment.completedAt);
    return (<div className="min-h-screen">
      <AppHeader user={user} active="meus-cursos"/>
      <main className="max-w-6xl mx-auto px-6 py-10 pb-20">
        <header className="mb-10">
          <h1 className="text-4xl font-heading font-bold">Minha jornada</h1>
          <p className="text-foreground-muted mt-2">
            {enrolled.length} trilhas — {completed.length} concluídas, {inProgress.length} em andamento.
          </p>
        </header>

        {enrolled.length === 0 && (<div className="rounded-lg border border-border bg-surface p-10 text-center">
            <p className="text-lg">Você ainda não está em nenhuma trilha.</p>
            <Link href="/" className="text-primary text-sm mt-2 inline-block">Explorar o catálogo →</Link>
          </div>)}

        {inProgress.length > 0 && (<section className="mb-12">
            <h2 className="text-xl font-heading font-semibold mb-5">Em andamento</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {inProgress.map(({ course, progress }) => (<Link key={course.id} href={`/course/${course.id}${progress.nextLessonId ? `?l=${progress.nextLessonId}` : ''}`} className="group flex gap-4 p-4 bg-surface border border-border rounded-md hover:border-primary/50 transition-colors">
                  <div className="relative w-32 h-20 rounded overflow-hidden flex-shrink-0">
                    <Image src={course.thumbnail} alt={course.title} fill className="object-cover"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{course.title}</h3>
                    <p className="text-xs text-foreground-muted mt-1 line-clamp-1">{course.subtitle}</p>
                    <div className="mt-3">
                      <div className="w-full bg-background h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${progress.percentage}%` }}/>
                      </div>
                      <p className="text-[11px] text-foreground-muted mt-1.5">
                        {progress.completedLessons}/{progress.totalLessons} aulas • {progress.percentage}%
                      </p>
                    </div>
                  </div>
                </Link>))}
            </div>
          </section>)}

        {completed.length > 0 && (<section>
            <h2 className="text-xl font-heading font-semibold mb-5">Concluídas</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completed.map(({ course, enrollment }) => (<Link key={course.id} href={`/course/${course.id}`} className="group p-4 bg-surface border border-primary/30 rounded-md hover:border-primary/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-primary">Concluída ✓</span>
                    {enrollment.completedAt && (<span className="text-[11px] text-foreground-muted">
                        {new Date(enrollment.completedAt).toLocaleDateString('pt-BR')}
                      </span>)}
                  </div>
                  <h3 className="font-heading font-semibold mt-2 group-hover:text-primary transition-colors">{course.title}</h3>
                  <p className="text-xs text-foreground-muted mt-1 line-clamp-2">{course.subtitle}</p>
                </Link>))}
            </div>
          </section>)}
      </main>
    </div>);
}
