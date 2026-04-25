import Image from 'next/image';
import { listUsers } from '@/core/application/users';
import { levelForXp } from '@/core/domain/levels';
import { getCourseById } from '@/core/application/courses';

export default function AdminAlunosPage() {
  const users = listUsers().filter((u) => u.role !== 'admin');

  return (
    <div className="p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold">Alunos</h1>
        <p className="text-foreground-muted text-sm mt-1">{users.length} membro{users.length !== 1 ? 's' : ''} ativos.</p>
      </div>

      <div className="border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-hover">
              <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-foreground-muted font-medium">Membro</th>
              <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-foreground-muted font-medium hidden md:table-cell">Nível</th>
              <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-foreground-muted font-medium hidden lg:table-cell">Trilhas</th>
              <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-foreground-muted font-medium hidden lg:table-cell">Streak</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => {
              const level = levelForXp(user.xp);
              const enrolledCourses = user.enrolledCourseIds
                .map((id) => getCourseById(id)?.title)
                .filter(Boolean);
              return (
                <tr key={user.id} className={`border-b border-border last:border-0 ${idx % 2 === 0 ? '' : 'bg-surface/40'}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Image src={user.avatar} alt={user.name} width={32} height={32} className="rounded-full object-cover flex-shrink-0" />
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-foreground-muted">@{user.handle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <p className="text-foreground-muted">{level.label}</p>
                    <p className="text-xs text-primary">{user.xp.toLocaleString('pt-BR')} XP</p>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    {enrolledCourses.length === 0 ? (
                      <span className="text-foreground-dim text-xs">Nenhuma</span>
                    ) : (
                      <ul className="text-xs text-foreground-muted space-y-0.5">
                        {enrolledCourses.slice(0, 2).map((t, i) => <li key={i}>· {t}</li>)}
                        {enrolledCourses.length > 2 && <li className="text-foreground-dim">+{enrolledCourses.length - 2} mais</li>}
                      </ul>
                    )}
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell text-foreground-muted text-xs">
                    🔥 {user.streak.current} dias
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
