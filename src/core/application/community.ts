import type { Post, Space, User } from '../domain/entities';
import * as communityRepo from '../infra/repos/community';
export async function listSpaces(): Promise<Space[]> {
    return (await communityRepo.listSpaces());
}
export async function getSpaceById(spaceId: string): Promise<Space | undefined> {
    return (await communityRepo.getSpaceById(spaceId));
}
export function canUserAccessSpace(user: User, space: Space): boolean {
    if (space.visibility === 'public')
        return true;
    if (space.visibility === 'members')
        return true;
    // premium: admin/moderator ou regra futura de tier premium
    return user.role === 'admin' || user.role === 'moderator';
}
export async function groupedSpaces(): Promise<Array<{
    categoryLabel: string;
    spaces: Space[];
}>> {
    const by = new Map<string, Space[]>();
    for (const s of (await communityRepo.listSpaces())) {
        const list = by.get(s.categoryLabel) ?? [];
        list.push(s);
        by.set(s.categoryLabel, list);
    }
    // Ordem preferida; categorias novas criadas no admin entram no fim.
    const preferred = ['Principal', 'Estudos', 'Suporte', 'Eventos', 'Premium'];
    const rest = [...by.keys()].filter((label) => !preferred.includes(label)).sort();
    return [...preferred, ...rest]
        .filter((label) => by.has(label))
        .map((label) => ({ categoryLabel: label, spaces: by.get(label)! }));
}
export async function listPosts(options?: {
    spaceId?: string;
}): Promise<Post[]> {
    return (await communityRepo.listPosts(options));
}
/** A regra vale também para busca e perfis, não somente para a página do espaço. */
export async function listVisiblePosts(user: User, options?: { spaceId?: string }): Promise<Post[]> {
    const allowed = new Set((await listSpaces()).filter((space) => canUserAccessSpace(user, space)).map((space) => space.id));
    return (await communityRepo.listPosts(options)).filter((post) => allowed.has(post.spaceId));
}
export async function getPostById(postId: string): Promise<Post | undefined> {
    return (await communityRepo.getPostById(postId));
}
export async function countCommentsBySpace(spaceId: string): Promise<number> {
    return (await communityRepo.countCommentsBySpace(spaceId));
}
export async function countPostsBySpace(spaceId: string): Promise<number> {
    return (await communityRepo.countPostsBySpace(spaceId));
}
