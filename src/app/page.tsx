import Image from 'next/image';
import Link from 'next/link';
import { getCurrentUser } from '@/core/application/session';
import { getDashboardSnapshot } from '@/core/application/dashboard';
import { topLearners } from '@/core/application/users';
import { AppHeader } from '@/components/AppHeader';
import { CourseCard } from '@/components/CourseCard';
import { Carousel } from '@/components/Carousel';
import { LevelBar } from '@/components/LevelBar';
import { BadgeChip } from '@/components/BadgeChip';
import { EventCard } from '@/components/EventCard';

export default function DashboardPage() {
  const user = getCurrentUser();
  const snap = getDashboardSnapshot(user);
  const hero = snap.continueWatching[0]?.course ?? snap.featured[0];
  const heroProgress = snap.continueWatching[0]?.progress;
  const leaderboard = topLearners(5);

  return (
    <div className="min-h-screen pb-20">
      <AppHeader active="trilhas" />

      {/* Hero */}
      <section className="relative w-full h-[68vh] min-h-[460px] flex items-end overflow-hidden">
        <div aria-hidden className="absolute inset-0">
          <Image src={hero.coverImage} alt="" fill priority className="object-cover opacity-70" />
        </div>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
        <div aria-hidden className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-background/95 to-transparent z-10" />

        <div className="relative z-20 max-w-3xl px-8 pb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] uppercase tracking-widest font-bold bg-primary/90 text-background px-2 py-1 rounded-sm">
              {heroProgress ? 'Continuar' : 'Destaque'}
            </span>
            <span className="text-xs text-foreground-muted">{hero.level} • {hero.modules.reduce((a, m) => a + m.lessons.length, 0)} aulas</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-heading font-bold leading-tight drop-shadow-2xl">{hero.title}</h2>
          <p className="text-lg text-foreground-muted mt-4 mb-8 line-clamp-2">{hero.subtitle}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/course/${hero.id}${heroProgress?.nextLessonId ? `?l=${heroProgress.nextLessonId}` : ''}`}
              className="bg-primary hover:bg-primary-hover text-background font-bold py-3 px-8 rounded-sm transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
              </svg>
              {heroProgress ? 'Continuar assistindo' : 'Começar trilha'}
            </Link>
            <Link href={`/course/${hero.id}`} className="bg-surface/80 hover:bg-surface text-foreground border border-border py-3 px-8 rounded-sm transition-colors font-medium backdrop-blur">
              Mais detalhes
            </Link>
          </div>

          {heroProgress && heroProgress.percentage > 0 && (
            <div className="mt-8 max-w-md">
              <div className="flex justify-between text-xs text-foreground-muted mb-1">
                <span>{heroProgress.completedLessons} de {heroProgress.totalLessons} aulas</span>
                <span>{heroProgress.percentage}%</span>
              </div>
              <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${heroProgress.percentage}%` }} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats + Eventos + Badges rail */}
      <section className="px-8 -mt-12 relative z-30 grid gap-4 md:grid-cols-3 max-w-7xl mx-auto">
        <LevelBar user={user} />

        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className="text-xs text-foreground-muted uppercase tracking-wider">Próximo evento</p>
              <h3 className="text-lg font-heading font-semibold mt-1">{snap.upcomingEvents[0]?.title ?? '—'}</h3>
            </div>
            <Link href="/events" className="text-xs text-primary">Todos →</Link>
          </div>
          {snap.upcomingEvents[0] && <EventCard event={snap.upcomingEvents[0]} />}
        </div>

        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className="text-xs text-foreground-muted uppercase tracking-wider">Suas conquistas</p>
              <h3 className="text-lg font-heading font-semibold mt-1">{user.badgeIds.length} badges</h3>
            </div>
            <Link href={`/profile/${user.id}`} className="text-xs text-primary">Perfil →</Link>
          </div>
          {snap.recentBadges.length === 0 ? (
            <p className="text-sm text-foreground-muted">Complete aulas e participe para destravar.</p>
          ) : (
            <div className="flex items-center gap-3">
              {snap.recentBadges.map((b) => <BadgeChip key={b.id} badge={b} size="sm" showLabel={false} />)}
              <div className="flex flex-col text-xs text-foreground-muted">
                <span className="text-foreground font-medium">Streak atual</span>
                <span>🔥 {user.streak.current} dias</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Carrosséis */}
      <main className="px-8 mt-16 space-y-14 max-w-[1600px] mx-auto">
        {snap.continueWatching.length > 0 && (
          <Carousel title="Sua jornada" subtitle="Continue de onde parou">
            {snap.continueWatching.map(({ course, progress }) => (
              <CourseCard key={course.id} course={course} variant="compact" progress={progress} />
            ))}
          </Carousel>
        )}

        <Carousel title="Em destaque" subtitle="As trilhas mais vivas da comunidade">
          {snap.featured.map((c) => <CourseCard key={c.id} course={c} variant="wide" />)}
        </Carousel>

        {snap.byCategory.map(({ category, courses }) => (
          <Carousel
            key={category.id}
            title={category.label}
            subtitle={category.description}
          >
            {courses.map((c) => <CourseCard key={c.id} course={c} variant="tall" />)}
          </Carousel>
        ))}

        {/* Leaderboard / ranking */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h3 className="text-xl font-heading font-semibold">Alunos em ascensão</h3>
              <p className="text-sm text-foreground-muted mt-1">Quem mais aprendeu e ensinou esta semana.</p>
            </div>
          </div>
          <ol className="grid md:grid-cols-5 gap-3">
            {leaderboard.map((item, idx) => (
              <li key={item.user.id}>
                <Link href={`/profile/${item.user.id}`} className="flex items-center gap-3 p-3 rounded-md border border-border bg-surface hover:border-primary/60 transition-colors">
                  <span className="text-lg font-heading font-bold text-foreground-muted w-6">#{idx + 1}</span>
                  <Image src={item.user.avatar} alt={item.user.name} width={40} height={40} className="rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{item.user.name}</p>
                    <p className="text-xs text-primary">{item.level.label} • {item.user.xp.toLocaleString('pt-BR')} XP</p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
