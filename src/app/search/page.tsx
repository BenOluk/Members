import Link from 'next/link';
import Image from 'next/image';
import { AppHeader } from '@/components/AppHeader';
import { CourseCard } from '@/components/CourseCard';
import { PostCard } from '@/components/PostCard';
import { requireUser } from '@/core/application/session';
import { globalSearch } from '@/core/application/search';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = '' } = await searchParams;
  const user = await requireUser();
  const results = globalSearch(q);
  const total = results.courses.length + results.users.length + results.spaces.length + results.posts.length;

  return (
    <div className="min-h-screen">
      <AppHeader user={user} />
      <main className="max-w-5xl mx-auto px-6 py-10 pb-20">
        <header className="mb-10">
          <form action="/search" className="mb-4">
            <input
              type="search"
              name="q"
              defaultValue={q}
              autoFocus
              placeholder="Buscar cursos, pessoas, posts..."
              className="w-full bg-surface border border-border rounded-full px-6 py-3 text-lg focus:outline-none focus:border-primary"
            />
          </form>
          <p className="text-foreground-muted text-sm">
            {q ? <>{total} resultados para <span className="text-foreground">“{q}”</span></> : 'Digite para buscar.'}
          </p>
        </header>

        {results.courses.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-heading font-semibold mb-4">Trilhas</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.courses.map((c) => <CourseCard key={c.id} course={c} variant="compact" />)}
            </div>
          </section>
        )}

        {results.users.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-heading font-semibold mb-4">Pessoas</h2>
            <ul className="grid md:grid-cols-2 gap-3">
              {results.users.map((u) => (
                <li key={u.id}>
                  <Link href={`/profile/${u.id}`} className="flex items-center gap-3 p-3 rounded-md bg-surface border border-border hover:border-primary/60 transition-colors">
                    <Image src={u.avatar} alt={u.name} width={48} height={48} className="rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{u.name}</p>
                      <p className="text-xs text-foreground-muted truncate">@{u.handle}{u.bio ? ` • ${u.bio}` : ''}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {results.spaces.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-heading font-semibold mb-4">Espaços</h2>
            <ul className="grid md:grid-cols-2 gap-3">
              {results.spaces.map((s) => (
                <li key={s.id}>
                  <Link href={`/space/${s.id}`} className="flex items-start gap-3 p-3 rounded-md bg-surface border border-border hover:border-primary/60 transition-colors">
                    <span className="text-2xl">{s.icon}</span>
                    <div className="min-w-0">
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-foreground-muted line-clamp-2">{s.description}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {results.posts.length > 0 && (
          <section>
            <h2 className="text-xl font-heading font-semibold mb-4">Posts</h2>
            <div className="space-y-4">
              {results.posts.map((p) => <PostCard key={p.id} post={p} currentUser={user} showSpace />)}
            </div>
          </section>
        )}

        {q && total === 0 && (
          <p className="text-foreground-muted text-center py-20">Nada encontrado.</p>
        )}
      </main>
    </div>
  );
}
