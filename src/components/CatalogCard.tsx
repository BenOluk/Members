import Image from 'next/image';
import Link from 'next/link';
import type { Course } from '@/core/domain/entities';
import { getCategoryById } from '@/core/application/courses';

interface CatalogCardProps {
  course: Course;
  enrolled: boolean;
  canAccess: boolean;
  priceFormatted: string;
}

export function CatalogCard({ course, enrolled, canAccess, priceFormatted }: CatalogCardProps) {
  const category = getCategoryById(course.categoryId);
  const totalLessons = course.modules.reduce((a, m) => a + m.lessons.length, 0);

  return (
    <div className="group relative flex flex-col border border-border rounded-sm overflow-hidden bg-surface hover:border-primary/40 transition-colors">
      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-80"
          />
        ) : (
          <div className="w-full h-full bg-surface-hover flex items-center justify-center">
            <span className="text-3xl text-foreground-dim glyph">✦</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />

        {/* Lock overlay */}
        {!canAccess && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-foreground-muted">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {course.featured && (
            <span className="bg-primary text-background text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm">Destaque</span>
          )}
          {enrolled && (
            <span className="bg-secondary text-foreground text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm">Inscrito</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 space-y-3">
        {category && (
          <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: category.accent }}>
            {category.label}
          </span>
        )}
        <h3 className="font-heading font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-xs text-foreground-muted line-clamp-2 flex-1">{course.subtitle}</p>

        <div className="flex items-center justify-between text-[11px] text-foreground-muted pt-1 border-t border-border-subtle">
          <span>{totalLessons} aulas</span>
          <span className="capitalize">{course.level}</span>
        </div>

        {/* CTA */}
        {canAccess ? (
          <Link
            href={`/course/${course.id}`}
            className="block text-center bg-primary hover:bg-primary-hover text-background font-semibold py-2 rounded-sm text-sm transition-colors"
          >
            {enrolled ? 'Continuar' : 'Acessar'}
          </Link>
        ) : (
          <div className="space-y-2">
            <p className="text-center text-primary font-semibold text-base">{priceFormatted}</p>
            <Link
              href={`/course/${course.id}`}
              className="block text-center border border-primary text-primary hover:bg-primary-dim font-medium py-2 rounded-sm text-sm transition-colors"
            >
              Ver detalhes
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
