import Link from 'next/link';
import { groupedSpaces } from '@/core/application/community';
interface SpaceSidebarProps {
    activeSpaceId?: string;
}
export async function SpaceSidebar({ activeSpaceId }: SpaceSidebarProps) {
    const groups = (await groupedSpaces());
    return (<aside className="w-full md:w-60 border-b md:border-r border-border bg-surface/40 md:h-[calc(100vh-57px)] md:sticky md:top-[57px] overflow-y-auto scrollbar-hide flex-shrink-0">
      <div className="px-5 py-6">
        <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.18em] mb-6">A Ordem</p>

        <nav aria-label="Espaços da comunidade" className="flex md:block gap-6 overflow-x-auto md:space-y-5">
          {groups.map((group) => (<div key={group.categoryLabel}>
              <p className="text-[10px] font-bold text-foreground-muted/60 uppercase tracking-widest mb-2">
                {group.categoryLabel}
              </p>
              <ul className="space-y-0.5">
                {group.spaces.map((space) => {
                const isActive = activeSpaceId === space.id;
                return (<li key={space.id}>
                      <Link href={`/space/${space.id}`} className={isActive
                        ? 'flex items-center justify-between px-2.5 py-2 rounded bg-primary/8 text-primary text-sm font-semibold'
                        : 'flex items-center justify-between px-2.5 py-2 rounded text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors duration-150 text-sm'}>
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-sm leading-none" aria-hidden>{space.icon}</span>
                          <span className="truncate">{space.name}</span>
                        </span>
                        {space.visibility === 'premium' && (<span className="text-[9px] uppercase tracking-wider text-primary/70 font-bold ml-1">Pro</span>)}
                      </Link>
                    </li>);
            })}
              </ul>
            </div>))}
        </nav>
      </div>
    </aside>);
}
