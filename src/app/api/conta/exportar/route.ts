import { getCurrentUser } from '@/core/application/session';
import { exportAccount } from '@/core/application/account';
export async function GET() {
    const user = await getCurrentUser();
    if (!user)
        return new Response('Não autorizado', { status: 401 });
    return Response.json((await exportAccount(user.id)), { headers: { 'Content-Disposition': 'attachment; filename="meus-dados-sanctum.json"', 'Cache-Control': 'no-store' } });
}
