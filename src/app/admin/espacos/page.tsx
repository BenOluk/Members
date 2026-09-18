import { ConfirmButton } from '@/components/ConfirmButton';
import { listSpaces, countPostsBySpace } from '@/core/application/community';
import { requireAdmin } from '@/core/application/session';
import { deleteSpace, saveSpace } from '@/core/application/actions/admin';
const inputCls = 'bg-background border border-border rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:border-primary/60';
const labelCls = 'block text-[10px] uppercase tracking-widest font-bold text-foreground-muted mb-1';
function SpaceForm({ space }: {
    space?: Awaited<ReturnType<typeof listSpaces>>[number];
}) {
    return (<form action={saveSpace} className="flex flex-wrap items-end gap-3">
      {space && <input type="hidden" name="id" value={space.id}/>}
      <div>
        <label className={labelCls} htmlFor={`sp-icon-${space?.id ?? 'new'}`}>Ícone</label>
        <input id={`sp-icon-${space?.id ?? 'new'}`} name="icon" defaultValue={space?.icon ?? ''} placeholder="🜏" className={`${inputCls} w-14`}/>
      </div>
      <div>
        <label className={labelCls} htmlFor={`sp-name-${space?.id ?? 'new'}`}>Nome</label>
        <input id={`sp-name-${space?.id ?? 'new'}`} name="name" required defaultValue={space?.name ?? ''} className={inputCls}/>
      </div>
      <div className="flex-1 min-w-40">
        <label className={labelCls} htmlFor={`sp-desc-${space?.id ?? 'new'}`}>Descrição</label>
        <input id={`sp-desc-${space?.id ?? 'new'}`} name="description" defaultValue={space?.description ?? ''} className={`${inputCls} w-full`}/>
      </div>
      <div>
        <label className={labelCls} htmlFor={`sp-cat-${space?.id ?? 'new'}`}>Categoria</label>
        <input id={`sp-cat-${space?.id ?? 'new'}`} name="categoryLabel" defaultValue={space?.categoryLabel ?? 'Estudos'} className={`${inputCls} w-28`}/>
      </div>
      <div>
        <label className={labelCls} htmlFor={`sp-vis-${space?.id ?? 'new'}`}>Visibilidade</label>
        <select id={`sp-vis-${space?.id ?? 'new'}`} name="visibility" defaultValue={space?.visibility ?? 'members'} className={inputCls}>
          <option value="members">Membros</option>
          <option value="premium">Premium (convite)</option>
          <option value="public">Pública</option>
        </select>
      </div>
      <button type="submit" className="bg-primary text-background font-bold px-4 py-1.5 rounded-sm hover:bg-primary-hover transition-colors text-xs">
        {space ? 'Salvar' : 'Criar espaço'}
      </button>
    </form>);
}
export default async function AdminSpacesPage() {
    await requireAdmin();
    const spaces = (await listSpaces());
    return (<div className="p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold">Espaços da Ordem</h1>
        <p className="text-foreground-muted mt-1 text-sm">{spaces.length} círculos ativos.</p>
      </div>

      <div className="mb-8 bg-surface border border-border rounded-md p-5">
        <h2 className="text-sm font-semibold text-primary mb-4">+ Novo espaço</h2>
        <SpaceForm />
      </div>

      <div className="space-y-3">
        {(await Promise.all(spaces.map(async (s) => (<div key={s.id} className="bg-surface border border-border rounded-md p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold">
                {s.icon} {s.name}
                <span className="text-foreground-muted font-normal ml-2 text-xs">
                  {(await countPostsBySpace(s.id))} posts • {s.memberCount.toLocaleString('pt-BR')} membros
                </span>
              </p>
              <form action={deleteSpace.bind(null, s.id)}>
                <ConfirmButton message="Excluir permanentemente? Faça um backup antes. Esta ação não pode ser desfeita pelo painel." className="text-xs border border-destructive/40 px-3 py-1.5 rounded-sm text-destructive hover:bg-destructive/10 transition-colors">
                  Excluir</ConfirmButton>
              </form>
            </div>
            <SpaceForm space={s}/>
          </div>))))}
      </div>
    </div>);
}
