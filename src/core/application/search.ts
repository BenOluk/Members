import type { Course, Post, Space, User } from '../domain/entities';
import { mockPosts, mockSpaces, mockUsers } from '../infra/mockData';
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
    users: mockUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.handle.toLowerCase().includes(q) ||
        (u.bio ?? '').toLowerCase().includes(q),
    ),
    spaces: mockSpaces.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q),
    ),
    posts: mockPosts.filter(
      (p) =>
        p.content.toLowerCase().includes(q) ||
        (p.title ?? '').toLowerCase().includes(q),
    ),
  };
}
