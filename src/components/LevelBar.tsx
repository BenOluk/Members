import type { User } from '@/core/domain/entities';
import { levelForXp, nextLevelForXp, levelProgressPercentage, TIER_ACCENT, xpToNextLevel } from '@/core/domain/levels';

interface LevelBarProps {
  user: User;
  variant?: 'compact' | 'full';
}

export function LevelBar({ user, variant = 'full' }: LevelBarProps) {
  const level = levelForXp(user.xp);
  const next = nextLevelForXp(user.xp);
  const pct = levelProgressPercentage(user.xp);
  const toNext = xpToNextLevel(user.xp);
  const accent = TIER_ACCENT[level.tier];

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wider font-bold" style={{ color: accent }}>
          {level.label}
        </span>
        <div className="flex-1 h-1 bg-background rounded-full overflow-hidden">
          <div className="h-full" style={{ width: `${pct}%`, backgroundColor: accent }} />
        </div>
        <span className="text-xs text-foreground-muted">{pct}%</span>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className="text-xs text-foreground-muted uppercase tracking-wider">Seu nível</p>
          <h3 className="text-2xl font-heading font-bold mt-1" style={{ color: accent }}>
            {level.label}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-foreground-muted">XP total</p>
          <p className="text-lg font-semibold text-foreground">{user.xp.toLocaleString('pt-BR')}</p>
        </div>
      </div>
      <div className="w-full h-2 bg-background rounded-full overflow-hidden">
        <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: accent }} />
      </div>
      <div className="flex justify-between mt-2 text-xs text-foreground-muted">
        <span>{level.label}</span>
        {next ? (
          <span>
            Faltam <span className="text-foreground font-medium">{toNext.toLocaleString('pt-BR')} XP</span> para{' '}
            <span className="text-primary font-medium">{next.label}</span>
          </span>
        ) : (
          <span className="text-primary">Círculo completo.</span>
        )}
      </div>
    </div>
  );
}
