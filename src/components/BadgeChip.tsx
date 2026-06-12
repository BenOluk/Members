import type { Badge } from '@/core/domain/entities';

const RARITY_STYLE: Record<Badge['rarity'], { ring: string; bg: string; text: string }> = {
  common:    { ring: 'ring-border',         bg: 'bg-surface',         text: 'text-foreground-muted' },
  rare:      { ring: 'ring-primary/40',     bg: 'bg-primary/8',       text: 'text-primary' },
  legendary: { ring: 'ring-primary/70',     bg: 'bg-primary/15',      text: 'text-primary-hover' },
};

interface BadgeChipProps {
  badge: Badge;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const EMOJI_FOR_ICON: Record<string, string> = {
  footprints: '👣',
  flame:      '🔥',
  'book-open': '📖',
  sparkles:   '✨',
  zap:        '⚡',
  'life-buoy': '🛟',
  crown:      '♛',
};

export function BadgeChip({ badge, size = 'md', showLabel = true }: BadgeChipProps) {
  const style = RARITY_STYLE[badge.rarity];
  const dim = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-12 h-12 text-xl';
  const icon = EMOJI_FOR_ICON[badge.icon] ?? '◈';

  return (
    <div className="flex flex-col items-center gap-1.5" title={`${badge.name} — ${badge.description}`}>
      <div
        className={`${dim} rounded-full ring-1 ${style.ring} ${style.bg} flex items-center justify-center hover:ring-2 transition-all duration-200`}
      >
        <span aria-hidden>{icon}</span>
      </div>
      {showLabel && (
        <span className={`text-[10px] uppercase tracking-widest font-bold text-center leading-tight max-w-[56px] ${style.text}`}>
          {badge.name}
        </span>
      )}
    </div>
  );
}
