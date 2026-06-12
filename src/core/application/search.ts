import type { Course, Post, Space, User } from '../domain/entities';
import * as communityRepo from '../infra/repos/community';
import * as usersRepo from '../infra/repos/users';
import { searchCourses } from './courses';

export interface SearchResults {
  courses: Course[];
  users: User[];
  spaces: Space[];
  posts: Post[];
}

export function globalSearch(query: string): SearchResults {
  const q = query.trim().toLowerCase();
  if (!q) return { courses: [], users: [], spaces: [], posts: [] };

  return {
    courses: searchCourses(q),
    users: usersRepo.list().filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.handle.toLowerCase().includes(q) ||
        (u.bio ?? '').toLowerCase().includes(q),
    ),
    spaces: communityRepo.listSpaces().filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q),
    ),
    posts: communityRepo.listPosts().filter(
      (p) =>
        p.content.toLowerCase().includes(q) ||
        (p.title ?? '').toLowerCase().includes(q),
    ),
  };
}
