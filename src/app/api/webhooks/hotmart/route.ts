import { processHotmart, validHottok } from '@/core/application/hotmart';
import { requestAccessEmail } from '@/core/application/account';
import { getUserById } from '@/core/application/users';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!process.env.HOTMART_HOTTOK) return Response.json({ error: 'not_configured' }, { status: 503 });
  if (!validHottok(request.headers.get('x-hotmart-hottok'))) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (!request.headers.get('content-type')?.includes('application/json')) return Response.json({ error: 'content_type' }, { status: 415 });
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: 'invalid_json' }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 128000) { await reader.cancel(); return Response.json({ error: 'payload_too_large' }, { status: 413 }); }
    chunks.push(value);
  }
  const body = Buffer.concat(chunks).toString('utf8');
  let payload: unknown;
  try { payload = JSON.parse(body); } catch { return Response.json({ error: 'invalid_json' }, { status: 400 }); }
  try {
    const result = await processHotmart(payload);
    if (result.newMember && result.userId) {
      // O acesso já está confirmado. Falha de e-mail nunca desfaz a compra.
      try { const user = await getUserById(result.userId); if (user) await requestAccessEmail(user.email); }
      catch { console.error('hotmart_welcome_failed'); }
    }
    return Response.json({ outcome: result.outcome }, { status: result.status });
  } catch {
    // Sem corpo bruto, e-mail ou segredos em logs. Hotmart poderá reenviar.
    console.error('hotmart_processing_failed');
    return Response.json({ error: 'processing_failed' }, { status: 503 });
  }
}
