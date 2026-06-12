import { requireAdmin } from '@/core/application/session';
import { listCategories } from '@/core/application/courses';
import { CourseEditor } from '@/components/admin/CourseEditor';

export default async function NewCoursePage() {
  const admin = await requireAdmin();
  return (
    <div className="p-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold">Nova trilha</h1>
        <p className="text-foreground-muted mt-1 text-sm">Estruture módulos e aulas; publique quando estiver pronta.</p>
      </div>
      <CourseEditor categories={listCategories()} instructorId={admin.id} />
    </div>
  );
}
