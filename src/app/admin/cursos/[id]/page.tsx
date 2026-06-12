import { notFound } from 'next/navigation';
import { requireAdmin } from '@/core/application/session';
import { getCourseById, listCategories } from '@/core/application/courses';
import { CourseEditor } from '@/components/admin/CourseEditor';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCoursePage({ params }: PageProps) {
  const { id } = await params;
  const admin = await requireAdmin();
  const course = getCourseById(id);
  if (!course) notFound();

  return (
    <div className="p-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold">Editar trilha</h1>
        <p className="text-foreground-muted mt-1 text-sm">{course.title}</p>
      </div>
      <CourseEditor categories={listCategories()} instructorId={admin.id} course={course} />
    </div>
  );
}
