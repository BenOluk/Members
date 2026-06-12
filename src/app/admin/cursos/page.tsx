import Link from 'next/link';
import Image from 'next/image';
import { listCourses, getCategoryById, allLessonsOfCourse } from '@/core/application/courses';
import { deleteCourse, togglePublishCourse } from '@/core/application/actions/admin';

export default function AdminCoursesPage() {
  const courses = listCourses({ includeUnpublished: true });

  return (
    <div className="p-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Trilhas</h1>
          <p className="text-foreground-muted mt-1 text-sm">{courses.length} no total.</p>
        </div>
        <Link
          href="/admin/cursos/novo"
          className="bg-primary text-background font-bold px-5 py-2 rounded-sm hover:bg-primary-hover transition-colors text-sm"
        >
          + Nova trilha
        </Link>
      </div>

      <div className="space-y-3">
        {courses.map((c) => {
          const category = getCategoryById(c.categoryId);
          const lessonCount = allLessonsOfCourse(c).length;
          return (
            <div key={c.id} className="flex items-center gap-4 p-4 bg-surface border border-border rounded-md">
              <div className="relative w-24 h-14 rounded overflow-hidden flex-shrink-0">
                <Image src={c.thumbnail} alt="" fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold text-sm truncate">{c.title}</h3>
                  {!c.isPublished && (
                    <span className="text-[9px] uppercase tracking-widest font-bold text-foreground-muted border border-border px-1.5 py-0.5 rounded-sm flex-shrink-0">
                      Rascunho
                    </span>
                  )}
                  {c.featured && (
                    <span className="text-[9px] uppercase tracking-widest font-bold text-primary border border-primary/30 px-1.5 py-0.5 rounded-sm flex-shrink-0">
                      Destaque
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground-muted mt-1">
                  {category?.label ?? c.categoryId} • {c.modules.length} módulos • {lessonCount} aulas • {c.totalEnrollments.toLocaleString('pt-BR')} matrículas
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <form action={togglePublishCourse.bind(null, c.id)}>
                  <button
                    type="submit"
                    className={
                      c.isPublished
                        ? 'text-xs border border-border px-3 py-1.5 rounded-sm text-foreground-muted hover:text-foreground transition-colors'
                        : 'text-xs border border-primary/40 px-3 py-1.5 rounded-sm text-primary hover:bg-primary/10 transition-colors'
                    }
                  >
                    {c.isPublished ? 'Despublicar' : 'Publicar'}
                  </button>
                </form>
                <Link
                  href={`/admin/cursos/${c.id}`}
                  className="text-xs border border-border px-3 py-1.5 rounded-sm text-foreground hover:border-primary/50 transition-colors"
                >
                  Editar
                </Link>
                <form action={deleteCourse.bind(null, c.id)}>
                  <button
                    type="submit"
                    className="text-xs border border-destructive/40 px-3 py-1.5 rounded-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Excluir
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
