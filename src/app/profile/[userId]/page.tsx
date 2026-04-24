import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { LevelBar } from '@/components/LevelBar';
import { BadgeChip } from '@/components/BadgeChip';
import { CourseCard } from '@/components/CourseCard';
import { PostCard } from '@/components/PostCard';
import { getUserProgress } from '@/core/application/users';
import { getCourseById, getCourseProgress } from '@/core/application/courses';
import { listPosts } from '@/core/application/community';
import { listCertificates } from '@/core/application/certificates';

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { userId } = await params;
  const snap = getUserProgress(userId);
  if (!snap) notFound();

  const { user, badges, level, nextLevel, xpToNext } = snap;
  const enrolled = user.enrolledCourseIds
    .map((id) => getCourseById(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((course) => ({ course, progress: getCourseProgress(user, course) }));
  const userPosts = listPosts().filter((p) => p.authorId === user.id);
  const certificates = listCertificates(user.id);

  return (
    <div className="min-h-screen">
      <AppHeader active="perfil" />

      <section className="relative">
        <div aria-hidden className="absolute inset-0 h-56 bg-gradient-to-b from-secondary/20 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-6 pt-10 pb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <Image src={user.avatar} alt={user.name} width={128} height={128} className="rounded-full border-4 border-background object-cover" />
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-heading font-bold">{user.name}</h1>
              <p className="text-foreground-muted">@{user.handle}{user.location ? ` • ${user.location}` : ''}</p>
              {user.bio && <p className="mt-3 text-foreground/90 max-w-2xl">{user.bio}</p>}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-foreground-muted">
                <span>Na Ordem desde {new Date(user.joinedAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                <span>•</span>
                <span>🔥 {user.streak.current} dias consecutivos (recorde: {user.streak.longest})</span>
                <span>•</span>
                <span>{user.completedLessonIds.length} aulas concluídas</span>
              </div>
            </div>
            <button className="bg-primary hover:bg-primary-hover text-background font-semibold px-6 py-2 rounded-sm">
              Seguir
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-6 pb-20 space-y-10">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <LevelBar user={user} />
          </div>
          <div className="bg-surface border border-border rounded-lg p-5">
            <p className="text-xs text-foreground-muted uppercase tracking-wider">Progresso total</p>
            <p className="text-3xl font-heading font-bold mt-1">{user.xp.toLocaleString('pt-BR')} XP</p>
            <p className="text-sm text-foreground-muted mt-1">
              {nextLevel ? <>Próximo: <span className="text-primary">{nextLevel.label}</span> em {xpToNext.toLocaleString('pt-BR')} XP</> : 'Círculo completo — convite recebido.'}
            </p>
            <p className="text-xs text-foreground-muted mt-4">Nível atual: <span className="text-foreground">{level.label}</span></p>
          </div>
        </div>

        <section>
          <h2 className="text-xl font-heading font-semibold mb-4">Conquistas ({badges.length})</h2>
          {badges.length === 0 ? (
            <p className="text-foreground-muted text-sm">Sem badges por enquanto.</p>
          ) : (
            <div className="flex flex-wrap gap-6 p-6 bg-surface border border-border rounded-lg">
              {badges.map((b) => <BadgeChip key={b.id} badge={b} />)}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold mb-4">Trilhas ({enrolled.length})</h2>
          {enrolled.length === 0 ? (
            <p className="text-foreground-muted text-sm">Nenhuma trilha em andamento.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolled.map(({ course, progress }) => (
                <CourseCard key={course.id} course={course} variant="compact" progress={progress} />
              ))}
            </div>
          )}
        </section>

        {certificates.length > 0 && (
          <section>
            <h2 className="text-xl font-heading font-semibold mb-4">Certificados ({certificates.length})</h2>
            <Link href="/certificates" className="text-sm text-primary hover:text-primary-hover">Ver todos →</Link>
          </section>
        )}

        <section>
          <h2 className="text-xl font-heading font-semibold mb-4">Posts recentes</h2>
          {userPosts.length === 0 ? (
            <p className="text-foreground-muted text-sm">Sem posts ainda.</p>
          ) : (
            <div className="space-y-4">
              {userPosts.map((p) => <PostCard key={p.id} post={p} showSpace />)}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
