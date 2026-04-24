import type { DashboardSnapshot, User } from '../domain/entities';
import { getContinueWatching, getFeaturedCourses, listCategories, getCoursesByCategory } from './courses';
import { getBadgesForUser } from './users';
import { listUpcomingEvents } from './events';
import { levelForXp, nextLevelForXp, xpToNextLevel } from '../domain/levels';

export function getDashboardSnapshot(user: User): DashboardSnapshot {
  const categories = listCategories();
  const byCategory = categories
    .map((category) => ({ category, courses: getCoursesByCategory(category.id) }))
    .filter((entry) => entry.courses.length > 0);

  const badges = getBadgesForUser(user);

  return {
    user,
    level: levelForXp(user.xp),
    nextLevel: nextLevelForXp(user.xp),
    xpToNextLevel: xpToNextLevel(user.xp),
    continueWatching: getContinueWatching(user),
    featured: getFeaturedCourses(),
    byCategory,
    recentBadges: badges.slice(-3).reverse(),
    upcomingEvents: listUpcomingEvents(3),
  };
}
