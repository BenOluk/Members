import Image from 'next/image';
import Link from 'next/link';
import { requireUser } from '@/core/application/session';
import { getDashboardSnapshot } from '@/core/application/dashboard';
import { topLearners } from '@/core/application/users';
import { AppHeader } from '@/components/AppHeader';
import { CourseCard } from '@/components/CourseCard';
import { Carousel } from '@/components/Carousel';
import { LevelBar } from '@/components/LevelBar';
import { BadgeChip } from '@/components/BadgeChip';
import { EventCard } from '@/components/EventCard';

export default async function DashboardPage() {
  const user = await requireUser();
  const snap = getDashboardSnapshot(user);
  const hero = snap.continueWatching[0]?.course ?? snap.featured[0] ?? snap.byCategory[0]?.courses[0];
  const heroProgress = snap.continueWatching[0]?.progress;
  const leaderboard = topLearners(5);

  return (
    <div className="min-h-screen pb-24">
      <AppHeader user={user} active="trilhas" />

      {/* Hero */}
      {hero ? (
        <section className="relative w-full h-[62vh] min-h-[420px] flex items-end overflow-hidden">
          <div aria-hidden className="absolute inset-0">
            <Image
              src={hero.coverImage}
              alt=""
              fill
              priority
              className="object-cover opacity-60"
            />
          </div>
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-transparent" />
          <div aria-hidden className="absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-background/90 to-transparent" />

          <div className="relative z-10 max-w-2xl px-8 pb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-background bg-primary px-2.5 py-1">
                {heroProgress ? 'Continuar' : 'Destaque'}
              </span>
              <span className="text-xs text-foreground-muted">
                {hero.level} · {hero.modules.reduce((a, m) => a + m.lessons.length, 0)} aulas
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold leading-tight">{hero.title}</h2>
            <p className="text-base text-foreground-muted mt-3 mb-7 line-clamp-2 max-w-lg">{hero.subtitle}</p>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/course/${hero.id}${heroProgress?.nextLessonId ? `?l=${heroProgress.nextLessonId}` : ''}`}
                className="bg-primary hover:bg-primary-hover text-background font-bold py-2.5 px-7 transition-colors duration-200 flex items-center gap-2 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
                {heroProgress ? 'Continuar trilha' : 'Começar agora'}
              </Link>
              <Link
                href={`/course/${hero.id}`}
                className="border border-border/70 hover:border-border text-foreground py-2.5 px-7 transition-colors duration-200 text-sm font-medium"
              >
                Detalhes
              </Link>
            </div>

            {heroProgress && heroProgress.percentage > 0 && (
              <div className="mt-6 max-w-sm">
                <div className="flex justify-between text-[11px] text-foreground-muted mb-1.5">
                  <span>{heroProgress.completedLessons}/{heroProgress.totalLessons} aulas</span>
                  <span>{heroProgress.percentage}%</span>
                </div>
                <div className="w-full h-px bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${heroProgress.percentage}%` }} />
                </div>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="px-8 pt-20 pb-10 text-center">
          <h2 className="text-3xl font-heading font-bold">O Sanctum ainda está silencioso.</h2>
          <p className="text-foreground-muted mt-2">Nenhuma trilha publicada por enquanto.</p>
        </section>
      )}

      {/* Status rail */}
      <section className={`px-8 ${hero ? '-mt-10' : 'mt-4'} relative z-20 grid gap-3 md:grid-cols-3 max-w-5xl mx-auto`}>
        <LevelBar user={user} />

        {/* Próximo evento */}
        <div className="bg-surface border border-border rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">Próximo evento</p>
            <Link href="/events" className="text-[10px] text-foreground-muted hover:text-primary transition-colors uppercase tracking-wider font-medium">Ver todos</Link>
          </div>
          {snap.upcomingEvents[0] ? (
            <EventCard event={snap.upcomingEvents[0]} />
          ) : (
            <p className="text-sm text-foreground-muted">Sem eventos agendados.</p>
          )}
        </div>

        {/* Badges */}
        <div className="bg-surface border border-border rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">Conquistas</p>
            <Link href={`/profile/${user.id}`} className="text-[10px] text-foreground-muted hover:text-primary transition-colors uppercase tracking-wider font-medium">Perfil</Link>
          </div>
          {snap.recentBadges.length === 0 ? (
            <p className="text-sm text-foreground-muted">Complete aulas para destravar conquistas.</p>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              {snap.recentBadges.map((b) => (
                <BadgeChip key={b.id} badge={b} size="sm" showLabel={false} />
              ))}
              <div className="ml-1">
                <p className="text-xs font-semibold text-foreground">{user.streak.current} dias</p>
                <p className="text-[11px] text-foreground-muted">streak ativo</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Carrosséis */}
      <main className="px-8 mt-14 space-y-12 max-w-[1600px] mx-auto">
        {snap.continueWatching.length > 0 && (
          <Carousel title="Sua jornada" subtitle="Continue de onde parou">
            {snap.continueWatching.map(({ course, progress }) => (
              <CourseCard key={course.id} course={course} variant="compact" progress={progress} />
            ))}
          </Carousel>
        )}

        {snap.featured.length > 0 && (
          <Carousel title="Em destaque" subtitle="As trilhas mais ativas do Sanctum">
            {snap.featured.map((c) => <CourseCard key={c.id} course={c} variant="wide" />)}
          </Carousel>
        )}

        {snap.byCategory.map(({ category, courses }) => (
          <Carousel key={category.id} title={category.label} subtitle={category.description}>
            {courses.map((c) => <CourseCard key={c.id} course={c} variant="tall" />)}
          </Carousel>
        ))}

        {/* Ranking — lista editorial, não grid de cards */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h3 className="text-lg font-heading font-bold">Em ascensão</h3>
              <p className="text-xs text-foreground-muted mt-1">Quem mais aprendeu e contribuiu esta semana.</p>
            </div>
          </div>

          <ol className="space-y-0">
            {leaderboard.map((item, idx) => (
              <li key={item.user.id}>
                <Link
                  href={`/profile/${item.user.id}`}
                  className={`flex items-center gap-4 py-3.5 ${idx < leaderboard.length - 1 ? 'border-b border-border' : ''} hover:bg-surface-hover px-2 -mx-2 rounded transition-colors duration-150 group`}
                >
                  <span
                    className={`w-7 text-sm font-heading font-bold tabular-nums ${idx === 0 ? 'text-primary' : 'text-foreground-muted'}`}
                  >
                    {idx === 0 ? '◈' : `${idx + 1}`}
                  </span>
                  <Image
                    src={item.user.avatar}
                    alt={item.user.name}
                    width={36}
                    height={36}
                    className="rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors duration-200">
                      {item.user.name}
                    </p>
                    <p className="text-[11px] text-foreground-muted">{item.level.label}</p>
                  </div>
                  <span className="text-sm font-heading font-bold tabular-nums text-foreground-muted text-right">
                    {item.user.xp.toLocaleString('pt-BR')}
                    <span className="text-[10px] font-normal ml-0.5">XP</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
