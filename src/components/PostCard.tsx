import Link from 'next/link';
import type { Post, User } from '@/core/domain/entities';
import { getUserById } from '@/core/application/users';
import { getSpaceById } from '@/core/application/community';
import { isModerator } from '@/core/application/session';
import { addComment, deletePost, toggleLikePost, togglePinPost } from '@/core/application/actions/community';
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
  currentUser: User;
  showSpace?: boolean;
}

export function PostCard({ post, currentUser, showSpace = false }: PostCardProps) {
  const author = getUserById(post.authorId);
  const space = showSpace ? getSpaceById(post.spaceId) : undefined;
  if (!author) return null;

  const liked = post.likedByUserIds.includes(currentUser.id);
  const canModerate = isModerator(currentUser);
  const canDelete = canModerate || post.authorId === currentUser.id;

  return (
    <article className="bg-surface border border-border rounded p-5 hover:border-foreground-muted/30 transition-colors duration-200 relative">
      {post.pinned && (
        <span className="absolute top-4 right-4 text-[10px] uppercase tracking-widest font-bold text-primary">
          Fixado
        </span>
      )}

      <div className="flex items-start gap-3.5 mb-4">
        <Avatar user={author} size="md" linkToProfile />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 leading-none">
            <Link href={`/profile/${author.id}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors duration-200">
              {author.name}
            </Link>
            {author.role === 'admin' && (
              <span className="text-[9px] uppercase tracking-widest font-bold text-primary border border-primary/30 px-1.5 py-0.5 rounded-sm">
                Grão-Mestre
              </span>
            )}
            {author.role === 'moderator' && (
              <span className="text-[9px] uppercase tracking-widest font-bold text-foreground-muted border border-border px-1.5 py-0.5 rounded-sm">
                Mod
              </span>
            )}
          </div>
          <p className="text-[11px] text-foreground-muted mt-1 flex items-center gap-1.5 flex-wrap">
            <span>@{author.handle}</span>
            <span aria-hidden>·</span>
            <span>{relativeDate(post.createdAt)}</span>
            {space && (
              <>
                <span aria-hidden>·</span>
                <Link href={`/space/${space.id}`} className="hover:text-primary transition-colors duration-200">
                  {space.icon} {space.name}
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      {post.title && (
        <h3 className="text-base font-heading font-semibold mb-2 leading-snug">{post.title}</h3>
      )}

      <div className="text-sm text-foreground/85 leading-relaxed mb-4 whitespace-pre-wrap">
        {post.content}
      </div>

      <div className="flex items-center gap-5 pt-4 border-t border-border text-[11px] text-foreground-muted font-medium uppercase tracking-wider">
        <form action={toggleLikePost.bind(null, post.id)}>
          <button
            type="submit"
            className={`flex items-center gap-1.5 transition-colors duration-200 ${liked ? 'text-primary' : 'hover:text-primary'}`}
            aria-label={liked ? 'Remover curtida' : 'Curtir post'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill={liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            {post.likes}
          </button>
        </form>
        <span className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          {post.comments.length}
        </span>

        <span className="ml-auto flex items-center gap-4">
          {canModerate && (
            <form action={togglePinPost.bind(null, post.id)}>
              <button type="submit" className="hover:text-foreground transition-colors duration-200">
                {post.pinned ? 'Desafixar' : 'Fixar'}
              </button>
            </form>
          )}
          {canDelete && (
            <form action={deletePost.bind(null, post.id)}>
              <button type="submit" className="hover:text-destructive transition-colors duration-200">
                Excluir
              </button>
            </form>
          )}
        </span>
      </div>

      {post.comments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border space-y-3.5">
          {post.comments.map((c) => {
            const cauthor = getUserById(c.authorId);
            if (!cauthor) return null;
            return (
              <div key={c.id} className="flex gap-3">
                <Avatar user={cauthor} size="sm" linkToProfile />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <Link href={`/profile/${cauthor.id}`} className="font-semibold hover:text-primary transition-colors duration-200">
                      {cauthor.name}
                    </Link>
                    <span className="text-foreground-muted text-[11px] ml-2">{relativeDate(c.createdAt)}</span>
                  </p>
                  <p className="text-sm text-foreground/85 mt-0.5 leading-relaxed">{c.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form action={addComment.bind(null, post.id)} className="mt-4 pt-4 border-t border-border flex gap-3">
        <Avatar user={currentUser} size="sm" />
        <input
          type="text"
          name="content"
          required
          maxLength={2000}
          placeholder="Responder..."
          className="flex-1 bg-background border border-border rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:border-primary/50 placeholder:text-foreground-muted/50"
        />
        <button
          type="submit"
          className="text-[11px] uppercase tracking-wider font-bold text-primary hover:text-primary-hover transition-colors"
        >
          Enviar
        </button>
      </form>
    </article>
  );
}
