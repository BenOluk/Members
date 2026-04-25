import Link from 'next/link';
import { getCurrentUser } from '@/core/application/session';
import { listPublishedCourses, listCategories, canAccessCourse, isEnrolled, formatPrice } from '@/core/application/courses';
import { AppHeader } from '@/components/AppHeader';
import { CatalogCard } from '@/components/CatalogCard';

interface PageProps {
  searchParams: Promise<{ cat?: string }>;
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const { cat } = await searchParams;
  const user = getCurrentUser();
  const courses = listPublishedCourses();
  const categories = listCategories();

  const filtered = cat ? courses.filter((c) => c.categoryId === cat) : courses;

  return (
    <div className="min-h-screen pb-20">
      <AppHeader active="catalogo" />

      <div className="max-w-7xl mx-auto px-8 pt-14">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-heading font-bold">Catálogo</h1>
          <p className="text-foreground-muted mt-2">Todas as trilhas disponíveis no Sanctum.</p>
        </div>

        {/* Filtros de categoria */}
        {courses.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            <Link
              href="/catalog"
              className={`px-4 py-1.5 rounded-sm text-sm border transition-colors ${!cat ? 'border-primary text-primary bg-primary-dim' : 'border-border text-foreground-muted hover:border-primary/50 hover:text-foreground'}`}
            >
              Todas
            </Link>
            {categories
              .filter((cat) => courses.some((c) => c.categoryId === cat.id))
              .map((category) => (
                <Link
                  key={category.id}
                  href={`/catalog?cat=${category.id}`}
                  className={`px-4 py-1.5 rounded-sm text-sm border transition-colors ${cat === category.id ? 'border-primary text-primary bg-primary-dim' : 'border-border text-foreground-muted hover:border-primary/50 hover:text-foreground'}`}
                >
                  {category.label}
                </Link>
              ))}
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-32 space-y-4">
            <span className="text-5xl text-foreground-dim glyph block">✦</span>
            <p className="text-xl font-heading font-semibold">Nenhuma trilha aqui ainda</p>
            <p className="text-foreground-muted max-w-sm mx-auto">
              O catálogo será preenchido em breve. Volte logo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((course) => (
              <CatalogCard
                key={course.id}
                course={course}
                enrolled={isEnrolled(user, course.id)}
                canAccess={canAccessCourse(user, course)}
                priceFormatted={course.isFree ? 'Gratuito' : formatPrice(course.price)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
