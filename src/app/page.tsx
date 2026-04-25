import Link from 'next/link';
import { getCurrentUser, isAdmin } from '@/core/application/session';
import { getContinueWatching, getFeaturedCourses, listPublishedCourses } from '@/core/application/courses';
import { AppHeader } from '@/components/AppHeader';
import { CourseCard } from '@/components/CourseCard';
import { Carousel } from '@/components/Carousel';
import { LevelBar } from '@/components/LevelBar';
import { EventCard } from '@/components/EventCard';
import { BadgeChip } from '@/components/BadgeChip';
import { getBadgeById } from '@/core/application/users';
import { listUpcomingEvents } from '@/core/application/events';

export default function DashboardPage() {
  const user = getCurrentUser();
  const continueWatching = getContinueWatching(user);
  const featured = getFeaturedCourses();
  const published = listPublishedCourses();
  const upcomingEvents = listUpcomingEvents(1);
  const recentBadges = user.badgeIds.slice(-3).map(getBadgeById).filter(Boolean) as import('@/core/domain/entities').Badge[];
  const admin = isAdmin(user);
  const hasCourses = published.length > 0;

  return (
    <div className="min-h-screen pb-20">
      <AppHeader active="trilhas" />

      {hasCourses ? (
        <>
          {/* Hero — curso em destaque */}
          {featured[0] && (
            <section className="relative w-full h-[60vh] min-h-[420px] flex items-end overflow-hidden">
              <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-background to-background" />
              <div aria-hidden className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-background/95 to-transparent z-10" />
              <div className="relative z-20 max-w-2xl px-10 pb-14 space-y-5">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Em destaque</span>
                <h2 className="text-5xl font-heading font-bold leading-tight">{featured[0].title}</h2>
                <p className="text-foreground-muted">{featured[0].subtitle}</p>
                <div className="flex gap-3">
                  <Link href={`/course/${featured[0].id}`} className="bg-primary hover:bg-primary-hover text-background font-semibold py-2.5 px-7 rounded-sm transition-colors text-sm">
                    Começar
                  </Link>
                  <Link href="/catalog" className="border border-border hover:border-primary/50 text-foreground py-2.5 px-7 rounded-sm transition-colors text-sm">
                    Ver catálogo
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Stats rail */}
          <section className="px-8 mt-10 grid gap-4 md:grid-cols-3 max-w-7xl mx-auto">
            <LevelBar user={user} />
            <div className="bg-surface border border-border rounded-sm p-5">
              <p className="text-[11px] text-foreground-muted uppercase tracking-widest mb-3">Próximo evento</p>
              {upcomingEvents[0] ? <EventCard event={upcomingEvents[0]} /> : <p className="text-sm text-foreground-muted">Nenhum evento agendado.</p>}
            </div>
            <div className="bg-surface border border-border rounded-sm p-5">
              <p className="text-[11px] text-foreground-muted uppercase tracking-widest mb-3">Conquistas recentes</p>
              {recentBadges.length === 0 ? (
                <p className="text-sm text-foreground-muted">Complete aulas para destravar badges.</p>
              ) : (
                <div className="flex items-center gap-3">
                  {recentBadges.map((b) => <BadgeChip key={b.id} badge={b} size="sm" showLabel={false} />)}
                  <div className="text-xs text-foreground-muted ml-auto">
                    <span className="block text-foreground font-medium">Streak</span>
                    <span>🔥 {user.streak.current} dias</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Carrosséis */}
          <main className="px-8 mt-14 space-y-14 max-w-[1600px] mx-auto">
            {continueWatching.length > 0 && (
              <Carousel title="Sua jornada" subtitle="Continue de onde parou">
                {continueWatching.map(({ course, progress }) => (
                  <CourseCard key={course.id} course={course} variant="compact" progress={progress} />
                ))}
              </Carousel>
            )}
            {featured.length > 0 && (
              <Carousel title="Destaques" subtitle="Trilhas selecionadas">
                {featured.map((c) => <CourseCard key={c.id} course={c} variant="wide" />)}
              </Carousel>
            )}
          </main>
        </>
      ) : (
        /* Empty state */
        <main className="max-w-lg mx-auto px-8 pt-32 pb-20 text-center space-y-6">
          <span className="text-5xl text-primary/40 glyph block">✦</span>
          <h2 className="text-3xl font-heading font-bold">Bem-vindo ao Sanctum</h2>
          <p className="text-foreground-muted leading-relaxed">
            Nenhuma trilha publicada ainda. Explore o catálogo ou, se você é o criador, adicione o primeiro curso pelo painel admin.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/catalog" className="bg-primary hover:bg-primary-hover text-background font-semibold py-2.5 px-7 rounded-sm transition-colors text-sm">
              Ver catálogo
            </Link>
            {admin && (
              <Link href="/admin/cursos/novo" className="border border-border hover:border-primary/50 text-foreground py-2.5 px-7 rounded-sm transition-colors text-sm">
                Criar trilha
              </Link>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
