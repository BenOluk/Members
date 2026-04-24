import Link from 'next/link';
import { groupedSpaces } from '@/core/application/community';

interface SpaceSidebarProps {
  activeSpaceId?: string;
}

export function SpaceSidebar({ activeSpaceId }: SpaceSidebarProps) {
  const groups = groupedSpaces();

  return (
    <aside className="hidden md:block w-64 border-r border-border bg-surface/50 h-[calc(100vh-57px)] sticky top-[57px] overflow-y-auto">
      <div className="p-6">
        <h2 className="text-xs font-bold text-foreground-muted uppercase tracking-widest mb-6">A Ordem</h2>

        <nav className="space-y-6">
          {groups.map((group) => (
            <div key={group.categoryLabel}>
              <h3 className="text-xs font-bold text-foreground-muted uppercase tracking-wider mb-3">{group.categoryLabel}</h3>
              <ul className="space-y-1">
                {group.spaces.map((space) => {
                  const isActive = activeSpaceId === space.id;
                  return (
                    <li key={space.id}>
                      <Link
                        href={`/space/${space.id}`}
                        className={
                          isActive
                            ? 'flex items-center justify-between px-3 py-2 rounded-md bg-primary/10 text-primary font-medium'
                            : 'flex items-center justify-between px-3 py-2 rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors'
                        }
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{space.icon}</span>
                          <span className="truncate">{space.name}</span>
                        </span>
                        {space.visibility === 'premium' && (
                          <span className="text-[9px] uppercase tracking-wider bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm">Pro</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
