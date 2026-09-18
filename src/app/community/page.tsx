import { requireUser } from '@/core/application/session';
import { canUserAccessSpace, listVisiblePosts, listSpaces } from '@/core/application/community';
import { createPost } from '@/core/application/actions/community';
import { SpaceSidebar } from '@/components/SpaceSidebar';
import { PostCard } from '@/components/PostCard';
import { Avatar } from '@/components/Avatar';
export default async function CommunityPage() {
    const user = await requireUser();
    const posts = (await listVisiblePosts(user));
    const spaces = (await listSpaces());
    const writableSpaces = spaces.filter((s) => canUserAccessSpace(user, s));
    return (<div className="flex flex-col md:flex-row">
      <SpaceSidebar />

      <main className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto px-5 md:px-10 py-12 md:py-20">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <p className="eyebrow">A casa conversa</p><h2 className="display-title !text-[clamp(2.8rem,6vw,5rem)]">A Ordem</h2>
              <p className="text-foreground-muted mt-1">
                Conversas, perguntas e descobertas dos membros.
              </p>
            </div>
          </div>

          {/* Composer */}
          {writableSpaces.length > 0 && <form action={createPost} className="folio p-5 md:p-7 mb-10">
            <div className="flex gap-4">
              <Avatar user={user} size="md"/>
              <div className="flex-1">
                <textarea name="content" required maxLength={5000} className="w-full bg-transparent border-none focus:ring-0 resize-none text-foreground placeholder-foreground-muted/50 focus:outline-none" rows={2} placeholder="O que você observou no tecido da realidade hoje?"/>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                  <select name="spaceId" aria-label="Espaço de publicação" className="bg-background border border-border rounded-sm px-3 py-1.5 text-xs text-foreground-muted focus:outline-none focus:border-primary/60">
                    {writableSpaces.map((s) => (<option key={s.id} value={s.id}>{s.icon} {s.name}</option>))}
                  </select>
                  <button type="submit" className="bg-primary text-background font-bold px-6 py-2 rounded-sm hover:bg-primary-hover transition-colors text-sm">
                    Publicar
                  </button>
                </div>
              </div>
            </div>
          </form>}

          <div className="space-y-6">
            {posts.length === 0 && <p className="panel p-6 text-foreground-muted">As conversas aparecerão aqui. {user.role === 'admin' && 'Crie os primeiros espaços no painel administrativo.'}</p>}
            {posts.map((p) => <PostCard key={p.id} post={p} currentUser={user} showSpace/>)}
          </div>
        </div>
      </main>
    </div>);
}
