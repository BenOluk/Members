import Link from 'next/link';
import { recoverPassword } from '@/core/application/actions/account';

export default async function RecoveryPage({ searchParams }: { searchParams: Promise<{ token?: string; erro?: string }> }) {
  const { token, erro } = await searchParams;
  return <main className="auth-shell"><div className="auth-panel">
    <p className="eyebrow">Sanctum · Acesso</p><h1>Defina sua senha.</h1>
    {erro || !token ? <p role="alert" className="mt-6">Solicite um novo link ao administrador. O anterior pode ter expirado, sido usado ou a senha não atende ao mínimo de 12 caracteres.</p>
      : <form action={recoverPassword} className="form-stack mt-8">
        <input type="hidden" name="token" value={token} />
        <label>Nova senha<input type="password" name="password" minLength={12} maxLength={128} autoComplete="new-password" required /></label>
        <p className="text-sm text-foreground-muted">Mínimo de 12 caracteres. As sessões anteriores serão encerradas.</p>
        <button className="button-primary">Salvar senha</button>
      </form>}
    <Link href="/login" className="inline-block text-primary mt-6">Voltar ao login</Link>
  </div></main>;
}
