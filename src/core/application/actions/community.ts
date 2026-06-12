'use server';

import { revalidatePath } from 'next/cache';
import * as communityRepo from '@/core/infra/repos/community';
import * as notificationsRepo from '@/core/infra/repos/notifications';
import * as usersRepo from '@/core/infra/repos/users';
import { canUserAccessSpace, getPostById, getSpaceById } from '../community';
import { isModerator, requireUser } from '../session';

function revalidateCommunity(spaceId?: string) {
  revalidatePath('/community');
  if (spaceId) revalidatePath(`/space/${spaceId}`);
}

export async function createPost(formData: FormData): Promise<void> {
  const user = await requireUser();
  const spaceId = String(formData.get('spaceId') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();

  if (!content || content.length > 5000) return;
  const space = getSpaceById(spaceId);
  if (!space || !canUserAccessSpace(user, space)) return;

  communityRepo.createPost({
    spaceId,
    authorId: user.id,
    title: title || undefined,
    content,
  });
  revalidateCommunity(spaceId);
}

export async function toggleLikePost(postId: string): Promise<void> {
  const user = await requireUser();
  const post = getPostById(postId);
  if (!post) return;
  const space = getSpaceById(post.spaceId);
  if (!space || !canUserAccessSpace(user, space)) return;

  communityRepo.toggleLike(postId, user.id);
  revalidateCommunity(post.spaceId);
  revalidatePath(`/profile/${post.authorId}`);
}

export async function addComment(postId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  const content = String(formData.get('content') ?? '').trim();
  if (!content || content.length > 2000) return;

  const post = getPostById(postId);
  if (!post) return;
  const space = getSpaceById(post.spaceId);
  if (!space || !canUserAccessSpace(user, space)) return;

  communityRepo.addComment({ postId, authorId: user.id, content });

  if (post.authorId !== user.id) {
    notificationsRepo.create({
      userId: post.authorId,
      kind: 'comment_reply',
      title: `${user.name} respondeu ao seu post`,
      body: content.length > 80 ? `${content.slice(0, 77)}...` : content,
      href: `/space/${post.spaceId}`,
    });
  }
  revalidateCommunity(post.spaceId);
}

export async function togglePinPost(postId: string): Promise<void> {
  const user = await requireUser();
  if (!isModerator(user)) return;
  const post = getPostById(postId);
  if (!post) return;
  communityRepo.setPinned(postId, !post.pinned);
  revalidateCommunity(post.spaceId);
}

export async function deletePost(postId: string): Promise<void> {
  const user = await requireUser();
  const post = getPostById(postId);
  if (!post) return;
  if (post.authorId !== user.id && !isModerator(user)) return;
  communityRepo.removePost(postId);
  revalidateCommunity(post.spaceId);
}

export async function toggleFollow(userId: string): Promise<void> {
  const user = await requireUser();
  if (user.id === userId || !usersRepo.getById(userId)) return;
  usersRepo.toggleFollow(user.id, userId);
  revalidatePath(`/profile/${userId}`);
}
