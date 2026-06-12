import type { Badge, User } from '../domain/entities';
import { levelForXp, levelProgressPercentage, nextLevelForXp, xpToNextLevel } from '../domain/levels';
import * as usersRepo from '../infra/repos/users';

export function getUserById(userId: string): User | undefined {
  return usersRepo.getById(userId);
}

export function getUserByHandle(handle: string): User | undefined {
  return usersRepo.getByHandle(handle);
}

export function listUsers(): User[] {
  return usersRepo.list();
}

export function getBadgeById(badgeId: string): Badge | undefined {
  return usersRepo.getBadgeById(badgeId);
}

export function getBadgesForUser(user: User): Badge[] {
  return usersRepo.getBadgesForUser(user.id);
}

export interface UserProgressSnapshot {
  user: User;
  badges: Badge[];
  level: ReturnType<typeof levelForXp>;
  nextLevel: ReturnType<typeof nextLevelForXp>;
  xpToNext: number;
  levelPercentage: number;
}

export function getUserProgress(userId: string): UserProgressSnapshot | undefined {
  const user = getUserById(userId);
  if (!user) return undefined;
  return {
    user,
    badges: getBadgesForUser(user),
    level: levelForXp(user.xp),
    nextLevel: nextLevelForXp(user.xp),
    xpToNext: xpToNextLevel(user.xp),
    levelPercentage: levelProgressPercentage(user.xp),
  };
}

export function topLearners(limit = 5): UserProgressSnapshot[] {
  return usersRepo
    .list() // já vem ordenado por XP desc
    .slice(0, limit)
    .map((u) => getUserProgress(u.id))
    .filter((s): s is UserProgressSnapshot => Boolean(s));
}
