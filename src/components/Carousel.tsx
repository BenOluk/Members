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
      <div className="flex items-end justify-between mb-4">
        <div>
          <h3 className="text-xl font-heading font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-sm text-foreground-muted mt-1">{subtitle}</p>}
        </div>
        {action && (
          <a href={action.href} className="text-sm text-primary hover:text-primary-hover font-medium transition-colors">
            {action.label} →
          </a>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
        {children}
      </div>
    </section>
  );
}
