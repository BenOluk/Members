import { requireUser } from '@/core/application/session';
import { updateProfile, updatePassword } from '@/core/application/actions/account';
import { AppHeader } from '@/components/AppHeader';

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUser();
  const { status } = await searchParams;
  return <><AppHeader user={user} active="perfil" /><main className="page-shell">
    <p className="eyebrow">Seu espaço</p><h1 className="display-title">Minha conta</h1>
    {status && <p role="status" className="panel mt-6">{status === 'salvo' ? 'Perfil atualizado.' : status === 'senha' ? 'Confira a senha atual e use uma nova senha de 12 a 128 caracteres.' : 'Confira os campos do perfil.'}</p>}
    <div className="grid lg:grid-cols-2 gap-8 mt-10">
      <section className="panel"><h2 className="text-2xl font-heading">Perfil</h2><form action={updateProfile} className="form-stack mt-6">
        <label>Nome<input name="name" required maxLength={100} defaultValue={user.name} /></label>
        <label>Sobre você<textarea name="bio" rows={4} maxLength={2000} defaultValue={user.bio} /></label>
        <label>Localização<input name="location" maxLength={150} defaultValue={user.location} /></label>
        <p className="text-sm text-foreground-muted">E-mail de acesso: {user.email}. Nome, apresentação e localização ficam visíveis para os membros.</p>
        <button className="button-primary">Salvar perfil</button>
      </form></section>
      <section className="panel"><h2 className="text-2xl font-heading">Acesso e dados</h2><form action={updatePassword} className="form-stack mt-6">
        <label>Senha atual<input name="current" type="password" required autoComplete="current-password" maxLength={128} /></label>
        <label>Nova senha<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label>
        <p className="text-sm text-foreground-muted">Use pelo menos 12 caracteres. Você precisará entrar novamente em todos os aparelhos.</p>
        <button className="button-secondary">Atualizar senha</button>
      </form><a className="inline-block text-primary mt-8" href="/api/conta/exportar">Baixar meus dados e anotações</a>
      <p className="text-sm text-foreground-muted mt-3">Para corrigir seu e-mail ou solicitar exclusão da conta, entre em contato com o administrador.</p></section>
    </div>
  </main></>;
}
