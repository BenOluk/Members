import Image from 'next/image';
import Link from 'next/link';
import type { Course, CourseProgress } from '@/core/domain/entities';
import { getCategoryById } from '@/core/application/courses';

interface CourseCardProps {
  course: Course;
  variant?: 'wide' | 'tall' | 'compact';
  progress?: CourseProgress;
}

export function CourseCard({ course, variant = 'wide', progress }: CourseCardProps) {
  const category = getCategoryById(course.categoryId);
  const lessonCount = course.modules.reduce((a, m) => a + m.lessons.length, 0);

  if (variant === 'compact') {
    return (
      <Link
        href={`/course/${course.id}`}
        className="group block min-w-[260px] snap-start border border-border rounded overflow-hidden bg-surface hover:border-primary/40 transition-colors duration-200"
      >
        <div className="relative h-28">
          <Image src={course.thumbnail} alt={course.title} fill className="object-cover opacity-80 group-hover:opacity-95 transition-opacity duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
        </div>
        <div className="p-3.5">
          {category && (
            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: category.accent }}>
              {category.label}
            </span>
          )}
          <h4 className="text-sm font-heading font-semibold mt-1 line-clamp-2 group-hover:text-primary transition-colors duration-200">{course.title}</h4>
          {progress && progress.percentage > 0 && (
            <div className="mt-3">
              <div className="w-full bg-background h-0.5 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }} />
              </div>
              <p className="text-[10px] text-foreground-muted mt-1.5">
                {progress.completedLessons}/{progress.totalLessons} aulas — {progress.percentage}%
              </p>
            </div>
          )}
        </div>
      </Link>
    );
  }

  if (variant === 'tall') {
    return (
      <Link
        href={`/course/${course.id}`}
        className="group relative min-w-[200px] aspect-[2/3] snap-start rounded overflow-hidden border border-border hover:border-primary/40 transition-colors duration-200"
      >
        <Image src={course.thumbnail} alt={course.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/98 via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {category && (
            <span className="text-[10px] uppercase tracking-widest font-bold block mb-1.5" style={{ color: category.accent }}>
              {category.label}
            </span>
          )}
          <h4 className="text-sm font-heading font-semibold line-clamp-3 group-hover:text-primary transition-colors duration-200 leading-snug">{course.title}</h4>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/course/${course.id}`}
      className="group relative min-w-[320px] h-52 snap-start rounded overflow-hidden border border-border hover:border-primary/40 transition-colors duration-200"
    >
      <Image src={course.thumbnail} alt={course.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/98 via-background/50 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-background/70 to-transparent" />

      {course.featured && (
        <div className="absolute top-3 left-3">
          <span className="bg-primary/90 text-background text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
            Destaque
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4">
        {category && (
          <span className="text-[10px] uppercase tracking-widest font-bold block mb-1.5" style={{ color: category.accent }}>
            {category.label}
          </span>
        )}
        <h4 className="text-lg font-heading font-bold group-hover:text-primary transition-colors duration-200 leading-snug">{course.title}</h4>
        <p className="text-xs text-foreground-muted mt-1.5 line-clamp-1">{course.subtitle}</p>
        <div className="flex items-center gap-4 mt-2.5 text-[11px] text-foreground-muted">
          <span className="flex items-center gap-1">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-primary">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.968a1 1 0 00.95.69h4.174c.969 0 1.371 1.24.588 1.81l-3.377 2.455a1 1 0 00-.364 1.118l1.287 3.967c.3.922-.755 1.688-1.54 1.118l-3.377-2.454a1 1 0 00-1.175 0l-3.376 2.454c-.784.57-1.838-.196-1.539-1.118l1.287-3.967a1 1 0 00-.364-1.118L2.05 9.395c-.783-.57-.38-1.81.588-1.81h4.174a1 1 0 00.95-.69l1.287-3.968z" />
            </svg>
            {course.ratingAverage.toFixed(1)}
          </span>
          <span>{course.totalEnrollments.toLocaleString('pt-BR')} membros</span>
          <span>{lessonCount} aulas</span>
        </div>
        {progress && progress.percentage > 0 && (
          <div className="mt-2.5 w-full bg-background/60 h-0.5 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${progress.percentage}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}
