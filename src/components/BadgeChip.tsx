import type { Badge } from '@/core/domain/entities';

const RARITY_STYLE: Record<Badge['rarity'], { ring: string; bg: string; text: string }> = {
  common:     { ring: 'ring-foreground-muted/30',  bg: 'bg-surface',               text: 'text-foreground-muted' },
  rare:       { ring: 'ring-primary/50',           bg: 'bg-primary/10',            text: 'text-primary' },
  legendary:  { ring: 'ring-primary',              bg: 'bg-gradient-to-br from-primary/30 to-secondary/30', text: 'text-primary-hover' },
};

interface BadgeChipProps {
  badge: Badge;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const EMOJI_FOR_ICON: Record<string, string> = {
  footprints: '👣',
  flame: '🔥',
  'book-open': '📖',
  sparkles: '✨',
  zap: '⚡',
  'life-buoy': '🛟',
  crown: '👑',
};

export function BadgeChip({ badge, size = 'md', showLabel = true }: BadgeChipProps) {
  const style = RARITY_STYLE[badge.rarity];
  const px = size === 'sm' ? 'w-10 h-10 text-base' : 'w-14 h-14 text-2xl';
  const icon = EMOJI_FOR_ICON[badge.icon] ?? '✦';

  return (
    <div className="flex flex-col items-center gap-1.5 group" title={`${badge.name} — ${badge.description}`}>
      <div className={`${px} rounded-full ring-2 ${style.ring} ${style.bg} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
        <span>{icon}</span>
      </div>
      {showLabel && (
        <span className={`text-[10px] uppercase tracking-wider font-bold text-center ${style.text}`}>{badge.name}</span>
      )}
    </div>
  );
}
