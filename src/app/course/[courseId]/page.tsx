import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { requireUser, isAdmin } from '@/core/application/session';
import { getCourseById, getLesson, getNextLesson, getPreviousLesson, getCourseProgress, getEnrollment, allLessonsOfCourse, listCourses, getCategoryById, } from '@/core/application/courses';
import { completeLesson, enroll } from '@/core/application/actions/learning';
import { getUserById } from '@/core/application/users';
import { AppHeader } from '@/components/AppHeader';
import { canStudy, canSelfEnroll } from '@/core/domain/access';
import { LessonVideo } from '@/components/LessonVideo';
import { lessonNote } from '@/core/application/learning';
import { saveLessonNote } from '@/core/application/actions/learning';
interface PageProps {
    params: Promise<{
        courseId: string;
    }>;
    searchParams: Promise<{
        l?: string;
        nota?: string;
    }>;
}
export default async function CoursePage({ params, searchParams }: PageProps) {
    const { courseId } = await params;
    const { l, nota } = await searchParams;
    const user = await requireUser();
    const course = (await getCourseById(courseId));
    if (!course || (!course.isPublished && !isAdmin(user) && !(await getEnrollment(user.id, course.id)))) {
        notFound();
    }
    const progress = getCourseProgress(user, course);
    const lessons = allLessonsOfCourse(course);
    const enrollment = (await getEnrollment(user.id, course.id));
    if (!canStudy(user, course, enrollment)) {
        return <div className="min-h-screen"><AppHeader user={user} active="trilhas"/>
      <main className="page-shell max-w-3xl">
        <p className="eyebrow">Trilha de estudo</p><h1 className="display-title">{course.title}</h1>
        <p className="text-xl text-foreground-muted mt-4">{course.subtitle}</p>
        <p className="whitespace-pre-line mt-8">{course.description}</p>
        <div className="panel mt-8">
          <h2 className="text-2xl font-heading">{enrollment?.expiresAt ? 'Seu período de acesso terminou.' : 'Esta trilha precisa de uma matrícula.'}</h2>
          <p className="text-foreground-muted my-4">{canSelfEnroll(user, course) ? 'Esta trilha está aberta aos membros. Confirme sua matrícula para começar.' : 'O administrador pode liberar ou renovar seu acesso. Seu progresso anterior fica guardado.'}</p>
          {canSelfEnroll(user, course) ? <form action={enroll.bind(null, course.id)}><button className="button-primary">Começar esta trilha</button></form>
                : course.checkoutUrl ? <a href={course.checkoutUrl} target="_blank" rel="noopener noreferrer" className="button-primary">Consultar inscrição</a> : null}
        </div>
        <Link href="/" className="inline-block mt-8 text-primary">Voltar às trilhas</Link>
      </main></div>;
    }
    const category = (await getCategoryById(course.categoryId));
    const instructor = (await getUserById(course.instructorId));
    const related = (await listCourses()).filter((c) => c.categoryId === course.categoryId && c.id !== course.id).slice(0, 4);
    // Curso sem aulas: estado vazio em vez de crash.
    if (lessons.length === 0) {
        return (<div className="min-h-screen">
        <AppHeader user={user} active="trilhas"/>
        <main className="max-w-2xl mx-auto p-12 text-center">
          <h1 className="text-2xl font-heading font-bold">{course.title}</h1>
          <p className="text-foreground-muted mt-2">Esta trilha ainda não tem aulas publicadas.</p>
          <Link href="/" className="text-primary text-sm mt-4 inline-block">← Voltar ao catálogo</Link>
        </main>
      </div>);
    }
    const activeLesson = (l ? getLesson(course, l) : undefined) ??
        (progress.nextLessonId ? getLesson(course, progress.nextLessonId) : undefined) ??
        lessons[0];
    const prev = getPreviousLesson(course, activeLesson.id);
    const next = getNextLesson(course, activeLesson.id);
    const isCompleted = user.completedLessonIds.includes(activeLesson.id);
    const note = await lessonNote(user.id, activeLesson.id);
    return (<div className="min-h-screen flex flex-col">
      <AppHeader user={user} active="trilhas"/>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-80 border-r border-border bg-surface/70 flex-shrink-0 order-2 md:order-1 md:h-[calc(100vh-57px)] md:sticky md:top-[57px] overflow-y-auto">
          <div className="p-6 border-b border-border">
            {category && (<span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: category.accent }}>
                {category.label}
              </span>)}
            <h2 className="text-xl font-heading font-bold mt-1">{course.title}</h2>
            <p className="text-xs text-foreground-muted mt-2">{course.subtitle}</p>
            <div className="w-full bg-background h-1.5 mt-4 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }}/>
            </div>
            <p className="text-xs text-foreground-muted mt-2">
              {progress.completedLessons}/{progress.totalLessons} aulas • {progress.percentage}% concluído
            </p>
          </div>

          <div className="p-4 space-y-4">
            {course.modules.map((mod) => (<div key={mod.id} className="border border-border rounded-md overflow-hidden">
                <div className="bg-surface-hover p-3 border-b border-border font-medium text-sm">{mod.title}</div>
                <div className="flex flex-col">
                  {mod.lessons.map((lesson) => {
                const isActive = lesson.id === activeLesson.id;
                const done = user.completedLessonIds.includes(lesson.id);
                return (<Link key={lesson.id} href={`/course/${course.id}?l=${lesson.id}`} className={isActive
                        ? 'text-left px-3 py-2.5 text-sm flex items-start gap-3 bg-primary/10 text-primary rounded'
                        : 'text-left px-3 py-2.5 text-sm flex items-start gap-3 text-foreground-muted hover:bg-surface-hover hover:text-foreground rounded transition-colors duration-150'}>
                        <div className="mt-0.5">
                          {done ? (<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-primary">
                              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd"/>
                            </svg>) : (<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 010 1.966l-5.603 3.113A1.125 1.125 0 019 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z" clipRule="evenodd"/>
                            </svg>)}
                        </div>
                        <div>
                          <p className={`font-medium ${isActive ? 'text-foreground' : ''}`}>{lesson.title}</p>
                          <p className="text-[11px] opacity-70 mt-0.5">{Math.floor(lesson.duration / 60)} min • {lesson.xpReward} XP</p>
                        </div>
                      </Link>);
            })}
                </div>
              </div>))}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 order-1 md:order-2 min-w-0">
          <LessonVideo key={activeLesson.id} url={activeLesson.videoUrl} title={activeLesson.title} poster={course.thumbnail}/>

          <div className="p-8 max-w-4xl">
            <div className="flex items-center gap-2 text-xs text-foreground-muted mb-2">
              <span>Aula {activeLesson.order}</span>
              <span>•</span>
              <span>{Math.floor(activeLesson.duration / 60)} min</span>
              <span>•</span>
              <span>+{activeLesson.xpReward} XP ao concluir</span>
            </div>
            <h1 className="text-3xl font-heading font-bold mb-4">{activeLesson.title}</h1>

            <div className="flex flex-wrap gap-3 mb-8">
              {!enrollment && (<form action={enroll.bind(null, course.id)}>
                  <button type="submit" className="bg-secondary/40 border border-secondary text-foreground px-6 py-2 rounded-sm font-semibold hover:bg-secondary/60 transition-colors">
                    Matricular-se nesta trilha
                  </button>
                </form>)}
              {isCompleted ? (<span className="bg-surface text-foreground-muted border border-border px-6 py-2 rounded-sm font-medium flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-primary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                  </svg>
                  Aula concluída
                </span>) : (<form action={completeLesson.bind(null, course.id, activeLesson.id)}>
                  <button type="submit" className="bg-primary text-background px-6 py-2 rounded-sm font-semibold flex items-center gap-2 hover:bg-primary-hover transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                    </svg>
                    Marcar como concluída
                  </button>
                </form>)}
              {prev && (<Link href={`/course/${course.id}?l=${prev.id}`} className="bg-surface hover:bg-surface-hover border border-border px-6 py-2 rounded-sm font-medium text-sm">
                  ← Aula anterior
                </Link>)}
              {next && (<Link href={`/course/${course.id}?l=${next.id}`} className="bg-surface hover:bg-surface-hover border border-border px-6 py-2 rounded-sm font-medium text-sm">
                  Próxima aula →
                </Link>)}
            </div>

            <div className="prose prose-invert max-w-none text-foreground-muted">
              <p className="text-lg leading-relaxed">{activeLesson.description}</p>
            </div>

            {instructor && (<div className="mt-10 flex items-center gap-4 p-4 bg-surface border border-border rounded-md">
                <Image src={instructor.avatar} alt={instructor.name} width={56} height={56} className="rounded-full object-cover"/>
                <div>
                  <p className="text-xs text-foreground-muted uppercase tracking-wider">Instrutor</p>
                  <p className="font-semibold">{instructor.name}</p>
                  {instructor.bio && <p className="text-sm text-foreground-muted mt-0.5">{instructor.bio}</p>}
                </div>
                <Link href={`/profile/${instructor.id}`} className="ml-auto text-sm text-primary hover:text-primary-hover">Ver perfil →</Link>
              </div>)}

            {activeLesson.resources.length > 0 && (<div className="mt-12 pt-8 border-t border-border">
                <h3 className="text-xl font-heading font-bold mb-4">Materiais complementares</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {activeLesson.resources.map((r) => (<a key={r.id} href={r.url} className="flex items-center gap-3 p-4 border border-border rounded-md bg-surface hover:border-primary/60 transition-colors group">
                      <div className="text-primary group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{r.title}</p>
                        <p className="text-xs text-foreground-muted uppercase tracking-wider">{r.kind}{r.sizeBytes ? ` • ${(r.sizeBytes / 1000000).toFixed(1)} MB` : ''}</p>
                      </div>
                    </a>))}
                </div>
              </div>)}

            <section id="caderno" className="panel mt-10">
              <h2 className="text-2xl font-heading">Seu caderno</h2>
              <p className="text-sm text-foreground-muted mt-1">Anotações privadas desta aula, visíveis na sua conta.</p>
              {nota && <p role="status" className="text-primary mt-3">{nota === 'salva' ? 'Anotações salvas.' : 'Não foi possível salvar. Confira seu acesso e tente novamente.'}</p>}
              <form action={saveLessonNote.bind(null, course.id, activeLesson.id)} className="form-stack mt-4">
                <label htmlFor="lesson-note" className="sr-only">Anotações da aula</label>
                <textarea id="lesson-note" name="content" rows={6} maxLength={20000} defaultValue={note} placeholder="O que você quer guardar desta aula?"/>
                <button className="button-secondary">Salvar anotações</button>
              </form>
            </section>
            {related.length > 0 && (<div className="mt-12 pt-8 border-t border-border">
                <h3 className="text-xl font-heading font-bold mb-4">Continue explorando</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {related.map((c) => (<Link key={c.id} href={`/course/${c.id}`} className="block rounded-md overflow-hidden border border-border hover:border-primary/60 transition-colors">
                      <div className="relative h-28">
                        <Image src={c.thumbnail} alt={c.title} fill className="object-cover"/>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-heading font-semibold line-clamp-2">{c.title}</p>
                      </div>
                    </Link>))}
                </div>
              </div>)}
          </div>
        </main>
      </div>
    </div>);
}
