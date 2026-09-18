import type { Course, Post, Space, User } from '../domain/entities';
import * as communityRepo from '../infra/repos/community';
import * as usersRepo from '../infra/repos/users';
import { searchCourses } from './courses';
import { canUserAccessSpace, listVisiblePosts } from './community';
export interface SearchResults {
    courses: Course[];
    users: User[];
    spaces: Space[];
    posts: Post[];
}
export async function globalSearch(query: string, viewer: User): Promise<SearchResults> {
    const q = query.trim().slice(0, 200).toLowerCase();
    if (!q)
        return { courses: [], users: [], spaces: [], posts: [] };
    return {
        courses: (await searchCourses(q)),
        users: (await usersRepo.list()).filter((u) => u.status !== 'suspended').filter((u) => u.name.toLowerCase().includes(q) ||
            u.handle.toLowerCase().includes(q) ||
            (u.bio ?? '').toLowerCase().includes(q)),
        spaces: (await communityRepo.listSpaces()).filter((s) => canUserAccessSpace(viewer, s)).filter((s) => s.name.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.slug.toLowerCase().includes(q)),
        posts: (await listVisiblePosts(viewer)).filter((p) => p.content.toLowerCase().includes(q) ||
            (p.title ?? '').toLowerCase().includes(q)),
    };
}
