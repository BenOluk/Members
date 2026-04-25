import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser } from '@/core/application/session';
import { getEnrolledCourses } from '@/core/application/courses';
import { AppHeader } from '@/components/AppHeader';
import { LevelBar } from '@/components/LevelBar';

export default function MeusCursosPage() {
  const user = getCurrentUser();
  const enrolled = getEnrolledCourses(user);
  const inProgress = enrolled.filter(({ progress }) => progress.percentage > 0 && progress.percentage < 100);
  const completed = enrolled.filter(({ progress }) => progress.percentage === 100);
  const notStarted = enrolled.filter(({ progress }) => progress.percentage === 0);

  return (
    <div className="min-h-screen pb-20">
      <AppHeader />

      <div className="max-w-5xl mx-auto px-8 pt-12">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-3xl font-heading font-bold">Minhas Trilhas</h1>
            <p className="text-foreground-muted mt-1.5">{enrolled.length} trilha{enrolled.length !== 1 ? 's' : ''} na sua jornada.</p>
          </div>
          <Link href="/catalog" className="text-sm text-primary hover:text-primary-hover transition-colors">
            Ver catálogo →
          </Link>
        </div>

        <div className="mb-10">
          <LevelBar user={user} />
        </div>

        {enrolled.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <span className="text-5xl text-foreground-dim glyph block">✦</span>
            <p className="text-xl font-heading font-semibold">Nenhuma trilha ainda</p>
            <p className="text-foreground-muted">Explore o catálogo e comece sua jornada.</p>
            <Link href="/catalog" className="inline-block mt-2 bg-primary hover:bg-primary-hover text-background font-semibold py-2.5 px-7 rounded-sm text-sm transition-colors">
              Ver catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {inProgress.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-widest text-foreground-muted mb-5">Em andamento</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {inProgress.map(({ course, progress }) => (
                    <CourseProgressCard key={course.id} course={course} percentage={progress.percentage} completedLessons={progress.completedLessons} totalLessons={progress.totalLessons} nextLessonId={progress.nextLessonId} />
                  ))}
                </div>
              </section>
            )}
            {notStarted.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-widest text-foreground-muted mb-5">Não iniciadas</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {notStarted.map(({ course, progress }) => (
                    <CourseProgressCard key={course.id} course={course} percentage={progress.percentage} completedLessons={progress.completedLessons} totalLessons={progress.totalLessons} nextLessonId={progress.nextLessonId} />
                  ))}
                </div>
              </section>
            )}
            {completed.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-widest text-foreground-muted mb-5">Concluídas</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {completed.map(({ course, progress }) => (
                    <CourseProgressCard key={course.id} course={course} percentage={progress.percentage} completedLessons={progress.completedLessons} totalLessons={progress.totalLessons} nextLessonId={progress.nextLessonId} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface CourseProgressCardProps {
  course: import('@/core/domain/entities').Course;
  percentage: number;
  completedLessons: number;
  totalLessons: number;
  nextLessonId?: string;
}

function CourseProgressCard({ course, percentage, completedLessons, totalLessons, nextLessonId }: CourseProgressCardProps) {
  const href = `/course/${course.id}${nextLessonId ? `?l=${nextLessonId}` : ''}`;

  return (
    <Link href={href} className="group flex gap-4 p-4 border border-border rounded-sm bg-surface hover:border-primary/40 transition-colors">
      <div className="relative w-24 h-16 flex-shrink-0 rounded-sm overflow-hidden bg-surface-hover">
        {course.thumbnail ? (
          <Image src={course.thumbnail} alt={course.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground-dim text-lg">✦</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-heading font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{course.title}</h3>
        <p className="text-[11px] text-foreground-muted mt-1">{completedLessons}/{totalLessons} aulas</p>
        <div className="mt-2 w-full bg-background h-1 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
        </div>
        <p className="text-[11px] text-primary mt-1">{percentage}%</p>
      </div>
    </Link>
  );
}
