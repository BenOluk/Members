import type { Level, LevelTier } from './entities';

// Curva de XP baseada em progressão hermética.
// Escolhida para que um aluno ativo (~30min/dia, 5x por semana) chegue a
// "Mestre" em ~6 meses; "Grão-Mestre" é convite — não acúmulo.
export const LEVELS: Level[] = [
  { tier: 'iniciado',    label: 'Iniciado',    minXp: 0,     nextTierXp: 500 },
  { tier: 'aprendiz',    label: 'Aprendiz',    minXp: 500,   nextTierXp: 2000 },
  { tier: 'adepto',      label: 'Adepto',      minXp: 2000,  nextTierXp: 5000 },
  { tier: 'mestre',      label: 'Mestre',      minXp: 5000,  nextTierXp: 12000 },
  { tier: 'grao_mestre', label: 'Grão-Mestre', minXp: 12000, nextTierXp: null },
];

export function levelForXp(xp: number): Level {
  const level = [...LEVELS].reverse().find((l) => xp >= l.minXp);
  return level ?? LEVELS[0];
}

export function nextLevelForXp(xp: number): Level | undefined {
  const current = levelForXp(xp);
  const idx = LEVELS.findIndex((l) => l.tier === current.tier);
  return LEVELS[idx + 1];
}

export function xpToNextLevel(xp: number): number {
  const current = levelForXp(xp);
  if (current.nextTierXp === null) return 0;
  return Math.max(0, current.nextTierXp - xp);
}

export function levelProgressPercentage(xp: number): number {
  const current = levelForXp(xp);
  if (current.nextTierXp === null) return 100;
  const span = current.nextTierXp - current.minXp;
  const into = xp - current.minXp;
  return Math.min(100, Math.round((into / span) * 100));
}

export const TIER_ACCENT: Record<LevelTier, string> = {
  iniciado: '#9c98a8',
  aprendiz: '#b08d57',
  adepto: '#d4af37',
  mestre: '#e6c866',
  grao_mestre: '#f3e5ab',
};
