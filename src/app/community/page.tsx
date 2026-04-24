import Image from 'next/image';
import { getCurrentUser } from '@/core/application/session';
import { listPosts, listSpaces } from '@/core/application/community';
import { SpaceSidebar } from '@/components/SpaceSidebar';
import { PostCard } from '@/components/PostCard';

export default function CommunityPage() {
  const user = getCurrentUser();
  const posts = listPosts();
  const totalMembers = listSpaces().reduce((acc, s) => acc + s.memberCount, 0);

  return (
    <div className="flex">
      <SpaceSidebar />

      <main className="flex-1 min-w-0">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-heading font-bold">A Ordem</h2>
              <p className="text-foreground-muted mt-1">
                Feed global — {posts.length} posts recentes em {listSpaces().length} espaços • {totalMembers.toLocaleString('pt-BR')} buscadores.
              </p>
            </div>
          </div>

          {/* Composer */}
          <div className="bg-surface border border-border rounded-lg p-4 mb-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                <Image src={user.avatar} alt={user.name} width={40} height={40} className="object-cover" />
              </div>
              <div className="flex-1">
                <textarea
                  className="w-full bg-transparent border-none focus:ring-0 resize-none text-foreground placeholder-foreground-muted/50 focus:outline-none"
                  rows={2}
                  placeholder="O que você observou no tecido da realidade hoje?"
                />
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                  <select className="bg-background border border-border rounded-sm px-3 py-1.5 text-xs text-foreground-muted focus:outline-none focus:border-primary/60">
                    {listSpaces().filter((s) => s.visibility !== 'premium' || user.role !== 'student').map((s) => (
                      <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                    ))}
                  </select>
                  <button className="bg-primary text-background font-bold px-6 py-2 rounded-sm hover:bg-primary-hover transition-colors text-sm">
                    Publicar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {posts.map((p) => <PostCard key={p.id} post={p} showSpace />)}
          </div>
        </div>
      </main>
    </div>
  );
}
