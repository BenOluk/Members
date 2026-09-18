import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { SpaceSidebar } from '@/components/SpaceSidebar';
import { PostCard } from '@/components/PostCard';
import { Avatar } from '@/components/Avatar';
import { requireUser } from '@/core/application/session';
import { getSpaceById, listPosts, canUserAccessSpace, countCommentsBySpace, } from '@/core/application/community';
import { createPost } from '@/core/application/actions/community';
interface PageProps {
    params: Promise<{
        spaceId: string;
    }>;
}
export default async function SpacePage({ params }: PageProps) {
    const { spaceId } = await params;
    const space = (await getSpaceById(spaceId));
    if (!space)
        notFound();
    const user = await requireUser();
    const canAccess = canUserAccessSpace(user, space);
    // Espaço restrito não vaza nada: nem posts, nem contadores.
    const posts = canAccess ? (await listPosts({ spaceId })) : [];
    const commentCount = canAccess ? (await countCommentsBySpace(spaceId)) : 0;
    return (<div className="min-h-screen flex flex-col">
      <AppHeader user={user} active="comunidade"/>

      <div className="flex flex-col md:flex-row">
        <SpaceSidebar activeSpaceId={spaceId}/>

        <main className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
            <header className="mb-8 pb-6 border-b border-border">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{space.icon}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-foreground-muted">{space.categoryLabel}</span>
                {space.visibility === 'premium' && (<span className="text-[10px] uppercase tracking-widest font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-sm">Premium</span>)}
              </div>
              <h1 className="text-3xl font-heading font-bold">{space.name}</h1>
              <p className="text-foreground-muted mt-2">{space.description}</p>
              {canAccess && (<div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-foreground-muted">
                  <span>{space.memberCount.toLocaleString('pt-BR')} membros</span>
                  <span>•</span>
                  <span>{posts.length} posts</span>
                  <span>•</span>
                  <span>{commentCount} comentários</span>
                </div>)}
            </header>

            {!canAccess ? (<div className="rounded-lg border border-primary/30 bg-surface p-10 text-center">
                <span className="text-4xl">🗝️</span>
                <h3 className="text-xl font-heading font-bold mt-4">Espaço restrito</h3>
                <p className="text-foreground-muted mt-2 max-w-md mx-auto">
                  Este círculo é acessível por convite direto do Sanctum. Continue a trilha e a participação que a chave aparece.
                </p>
              </div>) : (<>
                <form action={createPost} className="bg-surface border border-border rounded-lg p-4 mb-8">
                  <input type="hidden" name="spaceId" value={space.id}/>
                  <div className="flex gap-4">
                    <Avatar user={user} size="md"/>
                    <div className="flex-1">
                      <textarea name="content" required maxLength={5000} className="w-full bg-transparent border-none focus:ring-0 resize-none focus:outline-none placeholder-foreground-muted/50" rows={2} placeholder={`Escreva no espaço ${space.name}...`}/>
                      <div className="flex justify-end mt-2 pt-2 border-t border-border">
                        <button type="submit" className="bg-primary text-background font-bold px-6 py-2 rounded-sm hover:bg-primary-hover transition-colors text-sm">
                          Publicar
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                <div className="space-y-6">
                  {posts.length === 0 ? (<p className="text-foreground-muted text-center py-10">Nenhum post ainda. Seja o primeiro.</p>) : (posts.map((p) => <PostCard key={p.id} post={p} currentUser={user}/>))}
                </div>
              </>)}
          </div>
        </main>
      </div>
    </div>);
}
