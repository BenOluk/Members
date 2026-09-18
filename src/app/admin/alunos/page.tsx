import { requireAdmin } from '@/core/application/session';
import { listUsers } from '@/core/application/users';
import { listCourses, getEnrollmentsForUser } from '@/core/application/courses';
import { createMember, grantEnrollment, revokeEnrollment, setUserRole, toggleMemberStatus } from '@/core/application/actions/admin';
import { RecoveryLink } from '@/components/admin/RecoveryLink';
import { enrollmentIsActive } from '@/core/domain/access';

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const admin = await requireAdmin();
  const [users, courses, params] = await Promise.all([listUsers(), listCourses({ includeUnpublished: true }), searchParams]);
  const query = (params.q ?? '').toLowerCase().trim();
  const filtered = users.filter((user) => !query || user.name.toLowerCase().includes(query) || user.email.includes(query));
  return <div className="page-shell"><p className="eyebrow">Administração</p><h1 className="display-title">Membros</h1><p className="text-foreground-muted mt-3">{users.length} contas. Acesso e progresso sob seu controle.</p>
    {params.status && <p role="status" className="panel mt-6">{params.status === 'criado' ? 'Conta criada. Gere abaixo o link para o membro definir a senha.' : params.status === 'existente' ? 'Este e-mail já tem uma conta.' : 'Confira nome, e-mail, papel e senha (mínimo de 12 caracteres, se preenchida).'}</p>}
    <details className="panel mt-8"><summary className="text-primary">Criar conta manualmente</summary><form action={createMember} className="form-stack mt-6">
      <div className="grid md:grid-cols-2 gap-4"><label>Nome<input name="name" required maxLength={100}/></label><label>E-mail<input name="email" type="email" required maxLength={254}/></label><label>Senha inicial (opcional)<input name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password"/><span className="text-sm text-foreground-muted">Deixe vazia para entregar um link de definição de senha.</span></label><label>Papel<select name="role" defaultValue="student"><option value="student">Aluno</option><option value="moderator">Moderador</option><option value="admin">Administrador</option></select></label></div><button className="button-primary">Criar conta</button>
    </form></details>
    <form className="my-8 flex gap-3"><label className="sr-only" htmlFor="members-query">Buscar por nome ou e-mail</label><input id="members-query" name="q" defaultValue={params.q} placeholder="Nome ou e-mail" className="flex-1"/><button className="button-secondary">Buscar</button></form>
    <div className="space-y-5">{await Promise.all(filtered.map(async (user) => {
      const enrollments = await getEnrollmentsForUser(user.id);
      return <section key={user.id} className="panel">
        <div className="flex flex-wrap justify-between gap-4"><div><h2 className="text-xl">{user.name}</h2><p className="text-sm text-foreground-muted break-all">{user.email} · {user.status === 'suspended' ? 'Conta suspensa' : 'Conta ativa'}</p></div>
          {user.id !== admin.id && <form action={toggleMemberStatus.bind(null, user.id)}><button className="button-secondary">{user.status === 'suspended' ? 'Reativar conta' : 'Suspender conta'}</button></form>}
        </div>
        <div className="flex flex-wrap items-end gap-4 mt-5">
          <form action={setUserRole.bind(null, user.id)} className="flex gap-2"><select aria-label={`Papel de ${user.name}`} name="role" defaultValue={user.role} disabled={user.id === admin.id}><option value="student">Aluno</option><option value="moderator">Moderador</option><option value="admin">Administrador</option></select><button className="button-secondary" disabled={user.id === admin.id}>Salvar papel</button></form>
        </div>
        <div className="mt-6 border-t border-border pt-5"><h3 className="text-lg mb-3">Matrículas</h3>
          {!enrollments.length && <p className="text-sm text-foreground-muted">Nenhuma matrícula.</p>}
          {enrollments.map((enrollment) => <div key={enrollment.id} className="flex flex-wrap items-center justify-between gap-3 py-2 border-b border-border">
            <div><p>{courses.find((course) => course.id === enrollment.courseId)?.title ?? 'Trilha arquivada'}</p><p className="text-sm text-foreground-muted">{enrollmentIsActive(enrollment) ? enrollment.expiresAt ? `Até ${new Date(enrollment.expiresAt).toLocaleDateString('pt-BR')}` : 'Acesso sem vencimento' : 'Sem acesso ativo'}</p></div>
            {enrollmentIsActive(enrollment) && <form action={revokeEnrollment.bind(null, user.id, enrollment.courseId)}><button className="text-sm text-destructive">Bloquear esta trilha</button></form>}
          </div>)}
          <form action={grantEnrollment} className="flex flex-wrap items-end gap-3 mt-4"><input type="hidden" name="userId" value={user.id}/><label className="flex-1 min-w-40">Trilha<select name="courseId" required className="w-full"><option value="">Selecione</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label><label className="w-40">Prazo em dias<input name="days" type="number" defaultValue={0} min={0} max={36500} className="w-full"/></label><button className="button-secondary" disabled={!courses.length}>Conceder / renovar</button></form>
          <p className="text-sm text-foreground-muted mt-2">0 dias = sem vencimento. A concessão manual é independente da Hotmart. Bloquear esta trilha interrompe todos os acessos até nova concessão manual.</p>
        </div>
        <RecoveryLink userId={user.id}/>
      </section>;
    }))}</div>
  </div>;
}
