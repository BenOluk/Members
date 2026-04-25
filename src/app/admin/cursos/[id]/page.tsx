import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourseById, listCategories, formatPrice } from '@/core/application/courses';
import { CourseEditorClient } from '@/components/CourseEditorClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCursoPage({ params }: PageProps) {
  const { id } = await params;
  const course = getCourseById(id);
  if (!course) notFound();
  const categories = listCategories();

  return (
    <div className="p-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/cursos" className="text-foreground-muted hover:text-foreground transition-colors text-sm">← Cursos</Link>
        <span className="text-foreground-dim">/</span>
        <h1 className="text-xl font-heading font-bold truncate max-w-xs">{course.title}</h1>
        {course.isPublished ? (
          <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-sm uppercase tracking-wider font-semibold">Publicado</span>
        ) : (
          <span className="text-[10px] bg-foreground-dim/20 text-foreground-muted border border-border px-2 py-0.5 rounded-sm uppercase tracking-wider font-semibold">Rascunho</span>
        )}
      </div>

      <CourseEditorClient course={course} categories={categories} />
    </div>
  );
}
