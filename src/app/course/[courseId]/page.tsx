import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser } from '@/core/application/session';
import {
  getCourseById,
  getLesson,
  getNextLesson,
  getPreviousLesson,
  getCourseProgress,
  allLessonsOfCourse,
  listCourses,
  getCategoryById,
  canAccessCourse,
  formatPrice,
} from '@/core/application/courses';
import { getUserById } from '@/core/application/users';
import { AppHeader } from '@/components/AppHeader';

interface PageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ l?: string }>;
}

export default async function CoursePage({ params, searchParams }: PageProps) {
  const { courseId } = await params;
  const { l } = await searchParams;

  const course = getCourseById(courseId);
  if (!course) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="max-w-2xl mx-auto p-12 text-center">
          <h1 className="text-2xl font-heading font-bold">Trilha não encontrada</h1>
          <p className="text-foreground-muted mt-2">Volte ao <Link href="/" className="text-primary">catálogo</Link>.</p>
        </main>
      </div>
    );
  }

  const user = getCurrentUser();
  const hasAccess = canAccessCourse(user, course);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center px-8">
          <div className="max-w-md text-center space-y-6 py-20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-foreground-muted mx-auto">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <h1 className="text-2xl font-heading font-bold">{course.title}</h1>
            <p className="text-foreground-muted">{course.description}</p>
            <p className="text-3xl font-heading font-bold text-primary">
              {course.isFree ? 'Gratuito' : formatPrice(course.price)}
            </p>
            <div className="flex flex-col gap-3">
              <a href="#" className="block bg-primary hover:bg-primary-hover text-background font-semibold py-3 rounded-sm transition-colors">
                Adquirir acesso — {course.isFree ? 'Gratuito' : formatPrice(course.price)}
              </a>
              <Link href="/catalog" className="text-sm text-foreground-muted hover:text-foreground transition-colors">← Ver catálogo</Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const progress = getCourseProgress(user, course);
  const activeLesson = (l ? getLesson(course, l) : undefined) ?? getLesson(course, progress.nextLessonId ?? allLessonsOfCourse(course)[0].id) ?? allLessonsOfCourse(course)[0];
  const prev = getPreviousLesson(course, activeLesson.id);
  const next = getNextLesson(course, activeLesson.id);
  const isCompleted = user.completedLessonIds.includes(activeLesson.id);
  const category = getCategoryById(course.categoryId);
  const instructor = getUserById(course.instructorId);
  const related = listCourses().filter((c) => c.categoryId === course.categoryId && c.id !== course.id).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader active="trilhas" />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-80 border-r border-border bg-surface/70 flex-shrink-0 order-2 md:order-1 md:h-[calc(100vh-57px)] md:sticky md:top-[57px] overflow-y-auto">
          <div className="p-6 border-b border-border">
            {category && (
              <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: category.accent }}>
                {category.label}
              </span>
            )}
            <h2 className="text-xl font-heading font-bold mt-1">{course.title}</h2>
            <p className="text-xs text-foreground-muted mt-2">{course.subtitle}</p>
            <div className="w-full bg-background h-1.5 mt-4 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }} />
            </div>
            <p className="text-xs text-foreground-muted mt-2">
              {progress.completedLessons}/{progress.totalLessons} aulas • {progress.percentage}% concluído
            </p>
          </div>

          <div className="p-4 space-y-4">
            {course.modules.map((mod) => (
              <div key={mod.id} className="border border-border rounded-md overflow-hidden">
                <div className="bg-surface-hover p-3 border-b border-border font-medium text-sm">{mod.title}</div>
                <div className="flex flex-col">
                  {mod.lessons.map((lesson) => {
                    const isActive = lesson.id === activeLesson.id;
                    const done = user.completedLessonIds.includes(lesson.id);
                    return (
                      <Link
                        key={lesson.id}
                        href={`/course/${course.id}?l=${lesson.id}`}
                        className={
                          isActive
                            ? 'text-left p-3 text-sm flex items-start gap-3 bg-primary/10 text-primary border-l-2 border-primary'
                            : 'text-left p-3 text-sm flex items-start gap-3 text-foreground-muted hover:bg-surface-hover hover:text-foreground border-l-2 border-transparent transition-colors'
                        }
                      >
                        <div className="mt-0.5">
                          {done ? (
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-primary">
                              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 010 1.966l-5.603 3.113A1.125 1.125 0 019 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className={`font-medium ${isActive ? 'text-foreground' : ''}`}>{lesson.title}</p>
                          <p className="text-[11px] opacity-70 mt-0.5">{Math.floor(lesson.duration / 60)} min • {lesson.xpReward} XP</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 order-1 md:order-2 min-w-0">
          <div className="w-full aspect-video bg-black relative">
            <video
              key={activeLesson.id}
              src={activeLesson.videoUrl}
              poster={course.thumbnail}
              controls
              className="w-full h-full object-contain"
            />
          </div>

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
              <button
                className={
                  isCompleted
                    ? 'bg-surface text-foreground-muted border border-border px-6 py-2 rounded-sm font-medium flex items-center gap-2 cursor-default'
                    : 'bg-primary text-background px-6 py-2 rounded-sm font-semibold flex items-center gap-2 hover:bg-primary-hover transition-colors'
                }
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {isCompleted ? 'Aula concluída' : 'Marcar como concluída'}
              </button>
              {prev && (
                <Link href={`/course/${course.id}?l=${prev.id}`} className="bg-surface hover:bg-surface-hover border border-border px-6 py-2 rounded-sm font-medium text-sm">
                  ← Aula anterior
                </Link>
              )}
              {next && (
                <Link href={`/course/${course.id}?l=${next.id}`} className="bg-surface hover:bg-surface-hover border border-border px-6 py-2 rounded-sm font-medium text-sm">
                  Próxima aula →
                </Link>
              )}
            </div>

            <div className="prose prose-invert max-w-none text-foreground-muted">
              <p className="text-lg leading-relaxed">{activeLesson.description}</p>
              <p className="mt-4">
                Nesta sessão, mergulhamos em conceitos profundos revelados pelos textos herméticos. As anotações e reflexões devem ser levadas
                à comunidade para expansão coletiva do conhecimento.
              </p>
            </div>

            {instructor && (
              <div className="mt-10 flex items-center gap-4 p-4 bg-surface border border-border rounded-md">
                <Image src={instructor.avatar} alt={instructor.name} width={56} height={56} className="rounded-full object-cover" />
                <div>
                  <p className="text-xs text-foreground-muted uppercase tracking-wider">Instrutor</p>
                  <p className="font-semibold">{instructor.name}</p>
                  {instructor.bio && <p className="text-sm text-foreground-muted mt-0.5">{instructor.bio}</p>}
                </div>
                <Link href={`/profile/${instructor.id}`} className="ml-auto text-sm text-primary hover:text-primary-hover">Ver perfil →</Link>
              </div>
            )}

            {activeLesson.resources.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border">
                <h3 className="text-xl font-heading font-bold mb-4">Materiais complementares</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {activeLesson.resources.map((r) => (
                    <a key={r.id} href={r.url} className="flex items-center gap-3 p-4 border border-border rounded-md bg-surface hover:border-primary/60 transition-colors group">
                      <div className="text-primary group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{r.title}</p>
                        <p className="text-xs text-foreground-muted uppercase tracking-wider">{r.kind}{r.sizeBytes ? ` • ${(r.sizeBytes / 1_000_000).toFixed(1)} MB` : ''}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {related.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border">
                <h3 className="text-xl font-heading font-bold mb-4">Continue explorando</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {related.map((c) => (
                    <Link key={c.id} href={`/course/${c.id}`} className="block rounded-md overflow-hidden border border-border hover:border-primary/60 transition-colors">
                      <div className="relative h-28">
                        <Image src={c.thumbnail} alt={c.title} fill className="object-cover" />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-heading font-semibold line-clamp-2">{c.title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
