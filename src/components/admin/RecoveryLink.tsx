'use client';
import { useActionState } from 'react';
import { recoveryLink } from '@/core/application/actions/account';

export function RecoveryLink({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(recoveryLink.bind(null, userId), { token: '' });
  return <form action={action} className="mt-4">
    <button className="button-secondary" disabled={pending}>{pending ? 'Gerando…' : 'Gerar link para definir senha'}</button>
    {state.token && <div className="mt-3"><p className="text-sm text-foreground-muted">Copie o link e entregue ao titular. Expira em uma hora e só funciona uma vez.</p>
      <input aria-label="Link de definição de senha" readOnly className="w-full mt-2" value={`${typeof window !== 'undefined' ? window.location.origin : ''}/recuperar?token=${state.token}`} onFocus={(event) => event.currentTarget.select()} />
    </div>}
  </form>;
}
