import { ReactNode } from 'react';

interface CarouselProps {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
  children: ReactNode;
}

export function Carousel({ title, subtitle, action, children }: CarouselProps) {
  return (
    <section>
      <div className="flex items-end justify-between mb-5">
        <div>
          <h3 className="text-lg font-heading font-bold text-foreground tracking-wide">{title}</h3>
          {subtitle && <p className="text-xs text-foreground-muted mt-1">{subtitle}</p>}
        </div>
        {action && (
          <a href={action.href} className="text-xs text-foreground-muted hover:text-primary transition-colors font-medium uppercase tracking-wider">
            {action.label}
          </a>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        {children}
      </div>
    </section>
  );
}
