import Link from 'next/link';
import { listCourses, formatPrice } from '@/core/application/courses';

export default function AdminCursosPage() {
  const courses = listCourses();

  return (
    <div className="p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold">Cursos</h1>
          <p className="text-foreground-muted text-sm mt-1">{courses.length} trilha{courses.length !== 1 ? 's' : ''} no sistema.</p>
        </div>
        <Link
          href="/admin/cursos/novo"
          className="bg-primary hover:bg-primary-hover text-background font-semibold py-2 px-5 rounded-sm text-sm transition-colors"
        >
          + Nova trilha
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-24 border border-border rounded-sm bg-surface space-y-4">
          <span className="text-4xl text-foreground-dim glyph block">✦</span>
          <p className="font-heading font-semibold">Nenhuma trilha ainda</p>
          <p className="text-foreground-muted text-sm">Crie a primeira trilha do Sanctum.</p>
          <Link href="/admin/cursos/novo" className="inline-block bg-primary hover:bg-primary-hover text-background font-semibold py-2 px-6 rounded-sm text-sm transition-colors">
            Criar trilha
          </Link>
        </div>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover">
                <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-foreground-muted font-medium">Título</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-foreground-muted font-medium hidden md:table-cell">Categoria</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-foreground-muted font-medium hidden lg:table-cell">Preço</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-foreground-muted font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {courses.map((course, idx) => {
                const totalLessons = course.modules.reduce((a, m) => a + m.lessons.length, 0);
                return (
                  <tr key={course.id} className={`border-b border-border last:border-0 ${idx % 2 === 0 ? '' : 'bg-surface/40'}`}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">{course.title}</p>
                      <p className="text-xs text-foreground-muted mt-0.5">{totalLessons} aula{totalLessons !== 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-5 py-4 text-foreground-muted hidden md:table-cell capitalize">{course.categoryId}</td>
                    <td className="px-5 py-4 text-foreground-muted hidden lg:table-cell">
                      {course.isFree ? <span className="text-green-400">Gratuito</span> : formatPrice(course.price)}
                    </td>
                    <td className="px-5 py-4">
                      {course.isPublished ? (
                        <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-sm uppercase tracking-wider font-semibold">Publicado</span>
                      ) : (
                        <span className="text-[10px] bg-foreground-dim/20 text-foreground-muted border border-border px-2 py-0.5 rounded-sm uppercase tracking-wider font-semibold">Rascunho</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/cursos/${course.id}`} className="text-xs text-primary hover:text-primary-hover transition-colors">
                        Editar →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
