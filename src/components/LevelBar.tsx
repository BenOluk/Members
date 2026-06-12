import type { User } from '@/core/domain/entities';
import { levelForXp, nextLevelForXp, levelProgressPercentage, TIER_ACCENT, xpToNextLevel } from '@/core/domain/levels';

interface LevelBarProps {
  user: User;
  variant?: 'compact' | 'full';
}

const TIER_ORDER = ['iniciado', 'aprendiz', 'adepto', 'mestre', 'grao_mestre'] as const;

export function LevelBar({ user, variant = 'full' }: LevelBarProps) {
  const level = levelForXp(user.xp);
  const next = nextLevelForXp(user.xp);
  const pct = levelProgressPercentage(user.xp);
  const toNext = xpToNextLevel(user.xp);
  const accent = TIER_ACCENT[level.tier];
  const tierIndex = TIER_ORDER.indexOf(level.tier as typeof TIER_ORDER[number]);

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2.5">
        <span className="text-xs uppercase tracking-widest font-bold" style={{ color: accent }}>
          {level.label}
        </span>
        <div className="flex-1 h-px bg-border rounded-full overflow-hidden">
          <div className="h-full" style={{ width: `${pct}%`, backgroundColor: accent }} />
        </div>
        <span className="text-[10px] text-foreground-muted tabular-nums">{pct}%</span>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] text-foreground-muted uppercase tracking-widest mb-1.5">Sua iniciação</p>
          <h3 className="text-2xl font-heading font-bold tracking-wide" style={{ color: accent }}>
            {level.label}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-foreground-muted uppercase tracking-widest mb-1.5">XP total</p>
          <p className="text-lg font-heading font-semibold text-foreground tabular-nums">
            {user.xp.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Segmented tier progress */}
      <div className="flex gap-1 mb-3">
        {TIER_ORDER.map((tier, i) => {
          const tierAccent = TIER_ACCENT[tier];
          const filled = i < tierIndex;
          const current = i === tierIndex;
          return (
            <div
              key={tier}
              className="flex-1 h-1 rounded-full overflow-hidden bg-border"
              title={tier}
            >
              {filled && (
                <div className="h-full w-full rounded-full" style={{ backgroundColor: tierAccent }} />
              )}
              {current && (
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: tierAccent }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-[11px] text-foreground-muted">
        <span style={{ color: accent }}>{level.label}</span>
        {next ? (
          <span>
            <span className="text-foreground font-medium">{toNext.toLocaleString('pt-BR')} XP</span>{' '}
            para {next.label}
          </span>
        ) : (
          <span className="text-primary font-medium">Círculo completo.</span>
        )}
      </div>
    </div>
  );
}
