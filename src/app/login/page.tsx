import { login } from '@/core/application/actions/auth';
import { getCurrentUser } from '@/core/application/session';
import { needsSetup } from '@/core/application/installation';
import { redirect } from 'next/navigation';
import Link from 'next/link';
interface PageProps {
    searchParams: Promise<{
        erro?: string;
        criada?: string;
    }>;
}
export default async function LoginPage({ searchParams }: PageProps) {
    if ((await needsSetup()))
        redirect('/setup');
    if (await getCurrentUser())
        redirect('/');
    const { erro, criada } = await searchParams;
    return (<div className="min-h-screen flex items-center justify-center px-6">
      <div aria-hidden className="fixed inset-0 bg-gradient-to-b from-secondary/10 via-transparent to-transparent"/>

      <main className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <span className="text-primary text-3xl font-heading" aria-hidden>△</span>
          <h1 className="text-xl font-heading font-bold tracking-[0.22em] uppercase mt-3">Sanctum</h1>
          <p className="text-sm text-foreground-muted mt-2">Seu espaço privado de aprendizado e ascensão.</p>
        </div>

        <form action={login} className="bg-surface border border-border rounded-md p-6 space-y-4">
          {erro && (<p role="alert" className="text-sm text-destructive border border-destructive/40 bg-destructive/10 rounded-sm px-3 py-2">
              {erro === 'limite' ? 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' : 'E-mail ou senha inválidos.'}
            </p>)}

          {criada && <p role="status" className="text-sm text-primary">Conta pronta. Entre com seu e-mail e sua senha.</p>}
          <div>
            <label htmlFor="email" className="block text-[11px] uppercase tracking-widest font-bold text-foreground-muted mb-1.5">
              E-mail
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className="w-full bg-background border border-border rounded-sm px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary/60"/>
          </div>

          <div>
            <label htmlFor="password" className="block text-[11px] uppercase tracking-widest font-bold text-foreground-muted mb-1.5">
              Senha
            </label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className="w-full bg-background border border-border rounded-sm px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary/60"/>
          </div>

          <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-2.5 rounded-sm transition-colors duration-200 text-sm">
            Entrar na Ordem
          </button>
        </form>

        <p className="text-center text-xs text-foreground-muted mt-6">
          <Link className="text-primary" href="/primeiro-acesso">Primeiro acesso ou esqueci minha senha →</Link>
        </p>
      </main>
    </div>);
}
