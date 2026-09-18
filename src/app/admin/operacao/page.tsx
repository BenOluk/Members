import { requireAdmin } from '@/core/application/session';
import { operationStatus } from '@/core/application/operations';
export default async function OperationPage() {
  await requireAdmin();
  const status = await operationStatus();
  return <main className="space-y-8 max-w-5xl"><header><p className="eyebrow text-primary">Administração</p><h1 className="display-title text-4xl mt-3">Operação e segurança</h1><p className="text-foreground-muted mt-3">Confira a configuração antes de convidar seus membros.</p></header>
    <section className="grid sm:grid-cols-2 gap-4">{[
      ['Banco de dados', status.remote ? 'Externo · conectado' : 'Local · somente para desenvolvimento'],
      ['Hotmart', status.hotmart ? 'Token configurado · valide um evento real' : 'Falta configurar HOTMART_HOTTOK'],
      ['E-mail de acesso', status.email ? 'Configurado · valide a entrega no seu e-mail' : 'Manual · envio automático não configurado'],
      ['Endereço oficial', status.origin || 'Falta configurar APP_URL'],
    ].map(([label, value]) => <div className="panel p-5" key={label}><h2 className="text-primary">{label}</h2><p className="mt-2 break-all">{value}</p></div>)}</section>
    <section className="panel p-6"><h2 className="text-2xl font-heading">Cópia de segurança</h2><p className="my-4 text-foreground-muted">Contém membros, senhas protegidas por hash, aulas, compras, progresso e anotações privadas. Guarde em local criptografado. Não compartilhe e não envie ao GitHub. Sessões e links de senha não são exportados. Vídeos e arquivos externos precisam de cópia própria.</p><a className="button inline-block" href="/api/admin/backup" download>Baixar backup do banco</a><p className="text-sm text-foreground-muted mt-3">Para bancos grandes, use o comando de backup local. Restauração: somente em banco vazio, conforme o guia de ativação.</p></section>
    <section><h2 className="text-2xl font-heading mb-4">Atividade administrativa recente</h2><div className="overflow-x-auto panel"><table className="w-full text-sm"><thead><tr><th>Ação</th><th>Referência</th><th>Data · Brasília</th></tr></thead><tbody>{status.audit.map((row, index) => <tr key={index}><td>{String(row.action)}</td><td className="font-mono text-xs">{String(row.target_id ?? '—')}</td><td>{new Date(String(row.created_at)).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</td></tr>)}</tbody></table></div></section>
  </main>;
}
