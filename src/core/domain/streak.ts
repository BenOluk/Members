import type { Streak } from './entities';

// Regra pura de streak (testável sem DB):
// atividade hoje mantém; ontem incrementa; antes disso reinicia em 1.
function dayKey(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD (UTC)
}

export function advanceStreak(streak: Streak, nowIso: string): Streak {
  const today = dayKey(nowIso);
  const last = dayKey(streak.lastActivityAt);

  if (last === today) {
    return { ...streak, lastActivityAt: nowIso };
  }

  const yesterday = dayKey(new Date(new Date(`${today}T00:00:00Z`).getTime() - 86_400_000).toISOString());
  const current = last === yesterday ? streak.current + 1 : 1;

  return {
    current,
    longest: Math.max(streak.longest, current),
    lastActivityAt: nowIso,
  };
}
