import Link from 'next/link';
import type { Post } from '@/core/domain/entities';
import { getUserById } from '@/core/application/users';
import { getSpaceById } from '@/core/application/community';
import { Avatar } from './Avatar';

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

interface PostCardProps {
  post: Post;
  showSpace?: boolean;
}

export function PostCard({ post, showSpace = false }: PostCardProps) {
  const author = getUserById(post.authorId);
  const space = showSpace ? getSpaceById(post.spaceId) : undefined;
  if (!author) return null;

  return (
    <article className="bg-surface border border-border rounded-lg p-5 transition-colors hover:border-primary/40 relative">
      {post.pinned && (
        <span className="absolute top-3 right-3 text-[10px] uppercase tracking-widest font-bold text-primary bg-primary/10 px-2 py-1 rounded-sm">
          Fixado
        </span>
      )}

      <div className="flex items-start gap-4 mb-4">
        <Avatar user={author} size="lg" linkToProfile />
        <div className="min-w-0">
          <h4 className="font-bold text-foreground flex flex-wrap items-center gap-2">
            <Link href={`/profile/${author.id}`} className="hover:text-primary transition-colors">
              {author.name}
            </Link>
            {author.role === 'admin' && <span className="bg-primary/20 text-primary text-[10px] uppercase px-2 py-0.5 rounded-sm">Grão-Mestre</span>}
            {author.role === 'moderator' && <span className="bg-secondary/30 text-foreground text-[10px] uppercase px-2 py-0.5 rounded-sm">Mod</span>}
          </h4>
          <p className="text-xs text-foreground-muted flex items-center gap-2">
            <span>@{author.handle}</span>
            <span>•</span>
            <span>{relativeDate(post.createdAt)}</span>
            {space && (
              <>
                <span>•</span>
                <Link href={`/space/${space.id}`} className="hover:text-primary transition-colors">
                  {space.icon} {space.name}
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      {post.title && <h3 className="text-lg font-heading font-semibold mb-2">{post.title}</h3>}

      <div className="text-foreground/90 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</div>

      <div className="flex items-center gap-6 pt-4 border-t border-border text-foreground-muted text-sm font-medium">
        <button className="flex items-center gap-2 hover:text-primary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <span>{post.likes}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-foreground transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          <span>{post.comments.length}</span>
        </button>
        <button className="ml-auto text-xs uppercase tracking-wider hover:text-foreground transition-colors">Salvar</button>
      </div>

      {post.comments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          {post.comments.slice(0, 2).map((c) => {
            const cauthor = getUserById(c.authorId);
            if (!cauthor) return null;
            return (
              <div key={c.id} className="flex gap-3">
                <Avatar user={cauthor} size="sm" linkToProfile />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <Link href={`/profile/${cauthor.id}`} className="font-semibold hover:text-primary transition-colors">
                      {cauthor.name}
                    </Link>
                    <span className="text-foreground-muted text-xs ml-2">{relativeDate(c.createdAt)}</span>
                  </p>
                  <p className="text-sm text-foreground/90 mt-0.5">{c.content}</p>
                </div>
              </div>
            );
          })}
          {post.comments.length > 2 && (
            <Link href={`/space/${post.spaceId}#${post.id}`} className="text-xs text-primary hover:text-primary-hover">
              Ver todos os {post.comments.length} comentários →
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
