import Image from 'next/image';
import Link from 'next/link';
import type { Course, CourseProgress } from '@/core/domain/entities';
import { getCategoryById } from '@/core/application/courses';

interface CourseCardProps {
  course: Course;
  variant?: 'wide' | 'tall' | 'compact';
  progress?: CourseProgress;
}

const visuals: Record<string, { number: string; sigil: string }> = {
  'de-volta-ao-eixo': { number: 'I', sigil: '⊙' },
  pneuma: { number: 'II', sigil: '◯' },
  'fogo-interior': { number: 'III', sigil: '△' },
  aureum: { number: 'IV', sigil: '☿' },
  'fundamentos-hermetismo': { number: 'V', sigil: '✦' },
  impulso: { number: 'VI', sigil: '∴' },
};

function visualFor(course: Course) {
  const key = course.tags.find((tag) => visuals[tag]);
  return key ? visuals[key] : { number: '—', sigil: '✦' };
}

export async function CourseCard({ course, variant = 'wide', progress }: CourseCardProps) {
  const category = await getCategoryById(course.categoryId);
  const lessonCount = course.modules.reduce((total, module) => total + module.lessons.length, 0);
  const visual = visualFor(course);
  const hasCustomCover = course.thumbnail && course.thumbnail !== '/course-cover.svg';

  if (variant === 'compact') {
    return <Link href={`/course/${course.id}`} className="group block min-w-[270px] snap-start folio p-5 hover:border-primary/45 transition-colors">
      <div className="flex items-start justify-between gap-5"><span className="course-plate__number">{visual.number}</span><span className="text-3xl text-primary/45" aria-hidden>{visual.sigil}</span></div>
      <p className="course-plate__meta mt-7">{category?.label ?? 'Trilha'}</p>
      <h4 className="text-xl mt-2 leading-tight group-hover:text-primary transition-colors">{course.title}</h4>
      {progress && <div className="mt-5"><div className="study-progress"><span style={{ width: `${progress.percentage}%` }}/></div><p className="text-xs text-foreground-muted mt-2">{progress.percentage}% concluído</p></div>}
    </Link>;
  }

  if (variant === 'tall') {
    return <Link href={`/course/${course.id}`} className="group relative min-w-[220px] aspect-[2/3] snap-start course-plate p-6 flex flex-col justify-between" data-sigil={visual.sigil}>
      {hasCustomCover && <><Image src={course.thumbnail} alt="" fill className="object-cover opacity-25 mix-blend-luminosity"/><div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-transparent"/></>}
      <span className="course-plate__number relative">{visual.number}</span>
      <div className="relative"><p className="course-plate__meta">{category?.label ?? 'Trilha'}</p><h4 className="course-plate__title mt-3 group-hover:text-primary transition-colors">{course.title}</h4></div>
    </Link>;
  }

  return <Link href={`/course/${course.id}`} className="group course-plate min-w-[320px] p-7 flex flex-col justify-between" data-sigil={visual.sigil}>
    {hasCustomCover && <><Image src={course.thumbnail} alt="" fill className="object-cover opacity-20 mix-blend-luminosity transition-transform duration-700 group-hover:scale-[1.03]"/><div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"/></>}
    <div className="relative flex items-start justify-between gap-6"><span className="course-plate__number">{visual.number}</span>{course.featured && <span className="course-plate__meta">Em destaque</span>}</div>
    <div className="relative mt-10">
      <p className="course-plate__meta">{category?.label ?? 'Trilha'} · {lessonCount} {lessonCount === 1 ? 'aula' : 'aulas'}</p>
      <h4 className="course-plate__title mt-3 group-hover:text-primary transition-colors">{course.title}</h4>
      <p className="text-sm text-foreground-muted mt-3 max-w-md line-clamp-2">{course.subtitle}</p>
      {progress && <div className="mt-5 max-w-sm"><div className="study-progress"><span style={{ width: `${progress.percentage}%` }}/></div><p className="text-xs text-foreground-muted mt-2">{progress.completedLessons} de {progress.totalLessons} aulas · {progress.percentage}%</p></div>}
    </div>
  </Link>;
}
