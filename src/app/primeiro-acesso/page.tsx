import Link from 'next/link';
import { requestAccess } from '@/core/application/actions/account';
import { accessEmailEnabled } from '@/core/application/operations';
export const dynamic = 'force-dynamic';
export default async function AccessPage({ searchParams }: { searchParams: Promise<{ enviado?: string }> }) {
  const { enviado } = await searchParams;
  return <main className="auth-shell"><section className="panel p-6 sm:p-10 w-full max-w-lg">
    <p className="eyebrow text-primary">Sanctum · O Polímata Hermético</p>
    <h1 className="display-title text-4xl my-5">Seu acesso começa aqui.</h1>
    <p className="text-foreground-muted mb-6">Use o mesmo e-mail da compra para definir sua senha. Este formulário também recupera uma senha esquecida.</p>
    {accessEmailEnabled() ? <form action={requestAccess} className="form-stack">
      {enviado && <p role="status" className="text-primary">Se houver uma conta ativa para esse e-mail, você receberá um link. Confira também o spam. Aguarde alguns minutos antes de tentar novamente.</p>}
      <label>E-mail da compra<input type="email" name="email" required maxLength={254} autoComplete="email" /></label>
      <button className="button" type="submit">Receber link de acesso</button>
    </form> : <p className="panel p-4">O envio automático ainda não está ativo. Solicite um link de acesso ao responsável pelo curso, usando o contato da sua compra na Hotmart.</p>}
    <Link className="inline-block text-primary mt-6" href="/login">Voltar para entrar →</Link>
  </section></main>;
}
