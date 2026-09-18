import type { Badge, User } from '../domain/entities';
import { levelForXp, levelProgressPercentage, nextLevelForXp, xpToNextLevel } from '../domain/levels';
import * as usersRepo from '../infra/repos/users';
export async function getUserById(userId: string): Promise<User | undefined> {
    return (await usersRepo.getById(userId));
}
export async function getUserByHandle(handle: string): Promise<User | undefined> {
    return (await usersRepo.getByHandle(handle));
}
export async function listUsers(): Promise<User[]> {
    return (await usersRepo.list());
}
export async function getBadgeById(badgeId: string): Promise<Badge | undefined> {
    return (await usersRepo.getBadgeById(badgeId));
}
export async function getBadgesForUser(user: User): Promise<Badge[]> {
    return (await usersRepo.getBadgesForUser(user.id));
}
export interface UserProgressSnapshot {
    user: User;
    badges: Badge[];
    level: ReturnType<typeof levelForXp>;
    nextLevel: ReturnType<typeof nextLevelForXp>;
    xpToNext: number;
    levelPercentage: number;
}
export async function getUserProgress(userId: string): Promise<UserProgressSnapshot | undefined> {
    const user = (await getUserById(userId));
    if (!user)
        return undefined;
    return {
        user,
        badges: (await getBadgesForUser(user)),
        level: levelForXp(user.xp),
        nextLevel: nextLevelForXp(user.xp),
        xpToNext: xpToNextLevel(user.xp),
        levelPercentage: levelProgressPercentage(user.xp),
    };
}
export async function topLearners(limit = 5): Promise<UserProgressSnapshot[]> {
    return (await Promise.all((await usersRepo
        .list() // já vem ordenado por XP desc
    ).slice(0, limit)
        .map(async (u) => (await getUserProgress(u.id))))).filter((s): s is UserProgressSnapshot => Boolean(s));
}
