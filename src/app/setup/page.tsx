import { redirect } from 'next/navigation';
import { needsSetup } from '@/core/application/installation';
import { setup } from '@/core/application/actions/installation';
export const dynamic = 'force-dynamic';
export default async function SetupPage({ searchParams }: {
    searchParams: Promise<{
        erro?: string;
    }>;
}) {
    if (!(await needsSetup()))
        redirect('/login');
    const { erro } = await searchParams;
    return <main className="auth-shell"><div className="auth-panel">
    <p className="eyebrow">Sanctum · Primeiro acesso</p><h1>Abra a casa.</h1>
    <p className="text-foreground-muted">Crie sua conta de administrador. Esta etapa só fica disponível enquanto a plataforma não tem nenhuma conta.</p>
    <form action={setup} className="form-stack mt-8">
      {erro && <p role="alert">Não foi possível ativar. Confira a chave de instalação e os dados; após várias tentativas, aguarde 15 minutos.</p>}
      <label>Chave de instalação<input name="key" type="password" required minLength={32} maxLength={256} autoComplete="off"/></label>
      <label>Seu nome<input name="name" required maxLength={100} autoComplete="name"/></label>
      <label>E-mail<input name="email" type="email" required maxLength={254} autoComplete="email"/></label>
      <label>Senha de acesso<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password"/><span className="text-sm text-foreground-muted">Use pelo menos 12 caracteres.</span></label>
      <button className="button-primary">Ativar minha plataforma</button>
    </form>
  </div></main>;
}
