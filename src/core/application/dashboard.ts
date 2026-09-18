import type { DashboardSnapshot, User } from '../domain/entities';
import { getContinueWatching, listCourses, listCategories } from './courses';
import { getBadgesForUser } from './users';
import { listUpcomingEvents } from './events';
import { levelForXp, nextLevelForXp, xpToNextLevel } from '../domain/levels';
export async function getDashboardSnapshot(user: User): Promise<DashboardSnapshot> {
    const categories = (await listCategories());
    const courses = await listCourses();
    const byCategory = categories.map((category) => ({ category, courses: courses.filter((course) => course.categoryId === category.id) })).filter((entry) => entry.courses.length > 0);
    const badges = (await getBadgesForUser(user));
    return {
        user,
        level: levelForXp(user.xp),
        nextLevel: nextLevelForXp(user.xp),
        xpToNextLevel: xpToNextLevel(user.xp),
        continueWatching: (await getContinueWatching(user)),
        featured: courses.filter((course) => course.featured),
        byCategory,
        recentBadges: badges.slice(-3).reverse(),
        upcomingEvents: (await listUpcomingEvents(3)),
    };
}
