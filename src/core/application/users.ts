import type { User, Badge } from '../domain/entities';
import { mockUsers, mockBadges } from '../infra/mockData';
import { levelForXp, nextLevelForXp, xpToNextLevel, levelProgressPercentage } from '../domain/levels';

export function getUserById(userId: string): User | undefined {
  return mockUsers.find((u) => u.id === userId);
}

export function getUserByHandle(handle: string): User | undefined {
  return mockUsers.find((u) => u.handle === handle);
}

export function listUsers(): User[] {
  return mockUsers;
}

export function getBadgeById(badgeId: string): Badge | undefined {
  return mockBadges.find((b) => b.id === badgeId);
}

export function getBadgesForUser(user: User): Badge[] {
  return user.badgeIds
    .map((id) => mockBadges.find((b) => b.id === id))
    .filter((b): b is Badge => Boolean(b));
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
  return [...mockUsers]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit)
    .map((u) => getUserProgress(u.id)!)
    .filter(Boolean);
}
