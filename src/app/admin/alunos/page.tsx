import Image from 'next/image';
import { requireAdmin } from '@/core/application/session';
import { listUsers } from '@/core/application/users';
import { listCourses, getCourseById } from '@/core/application/courses';
import {
  createMember,
  grantEnrollment,
  resetMemberPassword,
  revokeEnrollment,
  setUserRole,
} from '@/core/application/actions/admin';

const inputCls =
  'bg-background border border-border rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:border-primary/60';

export default async function AdminMembersPage() {
  const admin = await requireAdmin();
  const users = listUsers();
  const courses = listCourses({ includeUnpublished: true });

  return (
    <div className="p-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Membros</h1>
          <p className="text-foreground-muted mt-1 text-sm">{users.length} contas na Ordem.</p>
        </div>
      </div>

      {/* Novo membro */}
      <details className="mb-8 bg-surface border border-border rounded-md">
        <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-primary select-none">
          + Convidar novo membro
        </summary>
        <form action={createMember} className="px-5 pb-5 pt-2 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-foreground-muted mb-1" htmlFor="nm-name">Nome</label>
            <input id="nm-name" name="name" required className={inputCls} />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-foreground-muted mb-1" htmlFor="nm-email">E-mail</label>
            <input id="nm-email" name="email" type="email" required className={inputCls} />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-foreground-muted mb-1" htmlFor="nm-pass">Senha (mín. 8)</label>
            <input id="nm-pass" name="password" type="password" required minLength={8} className={inputCls} />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-foreground-muted mb-1" htmlFor="nm-role">Papel</label>
            <select id="nm-role" name="role" className={inputCls} defaultValue="student">
              <option value="student">Aluno</option>
              <option value="moderator">Moderador</option>
              <option value="admin">Grão-Mestre</option>
            </select>
          </div>
          <button type="submit" className="bg-primary text-background font-bold px-5 py-1.5 rounded-sm hover:bg-primary-hover transition-colors text-xs">
            Criar conta
          </button>
        </form>
      </details>

      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="bg-surface border border-border rounded-md p-4">
            <div className="flex items-center gap-4">
              <Image src={u.avatar} alt="" width={40} height={40} className="rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {u.name} <span className="text-foreground-muted font-normal">@{u.handle}</span>
                </p>
                <p className="text-xs text-foreground-muted truncate">
                  {u.email} • {u.xp.toLocaleString('pt-BR')} XP • {u.completedLessonIds.length} aulas concluídas
                </p>
              </div>

              <form action={setUserRole.bind(null, u.id)} className="flex items-center gap-2 flex-shrink-0">
                <select
                  name="role"
                  defaultValue={u.role}
                  disabled={u.id === admin.id}
                  className={inputCls}
                  aria-label={`Papel de ${u.name}`}
                >
                  <option value="student">Aluno</option>
                  <option value="moderator">Moderador</option>
                  <option value="admin">Grão-Mestre</option>
                </select>
                {u.id !== admin.id && (
                  <button type="submit" className="text-xs border border-border px-3 py-1.5 rounded-sm hover:border-primary/50 transition-colors">
                    Aplicar
                  </button>
                )}
              </form>
            </div>

            <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-foreground-muted mr-1">Trilhas:</span>
              {u.enrolledCourseIds.length === 0 && (
                <span className="text-xs text-foreground-muted">nenhuma matrícula</span>
              )}
              {u.enrolledCourseIds.map((courseId) => {
                const course = getCourseById(courseId);
                return (
                  <form key={courseId} action={revokeEnrollment.bind(null, u.id, courseId)}>
                    <button
                      type="submit"
                      title="Revogar matrícula"
                      className="text-[11px] bg-background border border-border rounded-full px-3 py-1 hover:border-destructive/60 hover:text-destructive transition-colors"
                    >
                      {course?.title ?? courseId} ✕
                    </button>
                  </form>
                );
              })}

              <form action={grantEnrollment} className="flex items-center gap-2 ml-auto">
                <input type="hidden" name="userId" value={u.id} />
                <select name="courseId" className={inputCls} aria-label={`Conceder trilha a ${u.name}`}>
                  {courses
                    .filter((c) => !u.enrolledCourseIds.includes(c.id))
                    .map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <button type="submit" className="text-xs border border-primary/40 text-primary px-3 py-1.5 rounded-sm hover:bg-primary/10 transition-colors">
                  Conceder
                </button>
              </form>

              <form action={resetMemberPassword.bind(null, u.id)} className="flex items-center gap-2">
                <input
                  type="password"
                  name="password"
                  minLength={8}
                  required
                  placeholder="Nova senha"
                  className={inputCls}
                  aria-label={`Nova senha para ${u.name}`}
                />
                <button type="submit" className="text-xs border border-border px-3 py-1.5 rounded-sm hover:border-primary/50 transition-colors">
                  Redefinir
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
