import { requireAdmin } from '@/core/application/session';
import { listMappings, recentWebhookEvents } from '@/core/application/hotmart';
import { listCourses } from '@/core/application/courses';
import { configureProduct, deleteMapping } from '@/core/application/actions/hotmart';

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const [mappings, events, courses, params] = await Promise.all([listMappings(), recentWebhookEvents(), listCourses({ includeUnpublished: true }), searchParams]);
  return <div className="page-shell">
    <p className="eyebrow">Operação</p><h1 className="display-title">Hotmart e acessos</h1>
    <p className="text-foreground-muted mt-4 max-w-2xl">Uma compra aprovada libera as trilhas vinculadas ao produto. Renovações mantêm o acesso até o próximo vencimento. Cancelar a assinatura preserva o período já pago.</p>
    <section className="panel mt-8">
      <h2 className="text-2xl font-heading">Conexão</h2>
      <dl className="mt-4 space-y-2"><div><dt className="inline">Banco: </dt><dd className="inline">{process.env.TURSO_DATABASE_URL ? 'Turso configurado' : 'Local — configure Turso antes de publicar no Netlify'}</dd></div>
        <div><dt className="inline">Hotmart: </dt><dd className="inline">{process.env.HOTMART_HOTTOK ? 'Token configurado' : 'Defina HOTMART_HOTTOK no ambiente de produção'}</dd></div>
        <div><dt className="inline">Endereço do webhook: </dt><dd className="inline break-all">{process.env.APP_URL ?? 'https://SEU-SITE.netlify.app'}/api/webhooks/hotmart</dd></div>
      </dl>
      <p className="text-sm text-foreground-muted mt-4">Use a versão 2.0.0 do webhook. O token nunca é mostrado nesta página. Antes de vender, envie o teste pelo painel da Hotmart e confira o registro abaixo.</p>
    </section>
    <section className="panel mt-8"><h2 className="text-2xl font-heading">Vincular produto a uma trilha</h2>
      {params.status && <p role="status" className="mt-3">{params.status === 'salvo' ? 'Vínculo salvo.' : 'Confira o ID numérico do produto, a trilha e o prazo.'}</p>}
      <form action={configureProduct} className="form-stack mt-6">
        <div className="grid md:grid-cols-2 gap-5"><label>ID do produto Hotmart<input name="productId" required inputMode="numeric" pattern="[0-9]+" placeholder="Ex.: 1234567" /></label>
          <label>Código da oferta (opcional)<input name="offerCode" maxLength={200} placeholder="Vazio aplica a todas as ofertas" /></label>
          <label>Trilha<select name="courseId" required><option value="">Selecione</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
          <label>Prazo da compra avulsa, em dias<input name="days" type="number" min={0} max={36500} defaultValue={0} /><span className="text-sm text-foreground-muted">0 = sem vencimento. Assinaturas usam a data informada pela Hotmart.</span></label>
        </div><button className="button-primary" disabled={!courses.length}>Salvar vínculo</button>
      </form>
    </section>
    <section className="mt-8"><h2 className="text-2xl font-heading mb-4">Produtos vinculados</h2>
      {!mappings.length && <p className="text-foreground-muted">Crie uma trilha e vincule seu produto para começar.</p>}
      {mappings.map((mapping) => <div key={mapping.id} className="panel flex flex-wrap justify-between gap-4 mb-3"><div><p>{courses.find((c) => c.id === mapping.course_id)?.title}</p><p className="text-sm text-foreground-muted">Produto {mapping.product_id} · {mapping.offer_code || 'Todas as ofertas'} · {mapping.access_days ? `${mapping.access_days} dias` : 'Avulsa sem vencimento'}</p></div><form action={deleteMapping.bind(null, mapping.id)}><button className="button-secondary">Remover vínculo</button></form></div>)}
      <p className="text-sm text-foreground-muted mt-3">Mudanças de vínculo valem para os próximos eventos. Compras anteriores continuam registradas.</p>
    </section>
    <section className="mt-10"><h2 className="text-2xl font-heading mb-4">Últimos eventos processados</h2>
      {!events.length && <p className="text-foreground-muted">Nenhum evento recebido. Falhas de autenticação ou produtos sem vínculo aparecem no histórico da Hotmart.</p>}
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th>Evento</th><th>Produto</th><th>Resultado</th><th>Recebido</th></tr></thead><tbody>{events.map((event) => <tr key={String(event.id)}><td>{String(event.event)}</td><td>{String(event.product_id)}</td><td>{String(event.outcome)}</td><td>{new Date(String(event.processed_at)).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</td></tr>)}</tbody></table></div>
    </section>
  </div>;
}
