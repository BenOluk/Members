/** Provedor opcional. Tokens e destinatários nunca são gravados nos logs. */
export function emailConfigured(): boolean {
  try {
    const origin = new URL(process.env.APP_URL ?? '');
    return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && origin.protocol === 'https:' && !origin.username && !origin.password);
  } catch { return false; }
}

export async function sendAccessEmail(email: string, token: string): Promise<void> {
  if (!emailConfigured()) throw new Error('Email not configured');
  const url = new URL('/recuperar', process.env.APP_URL);
  url.searchParams.set('token', token);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `access-${token}` },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM, to: [email], subject: 'Seu acesso ao Sanctum',
      text: `Seu acesso ao Sanctum\n\nDefina uma senha ou recupere seu acesso pelo link abaixo. Ele vale por uma hora e só pode ser usado uma vez.\n\n${url.toString()}\n\nSe você não solicitou este e-mail nem fez uma compra, ignore esta mensagem. Sua senha atual não foi alterada.\n\nO Polímata Hermético`,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Email delivery failed');
}
