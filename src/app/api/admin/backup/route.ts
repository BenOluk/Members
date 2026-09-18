import { getCurrentUser } from '@/core/application/session';
import { databaseBackup } from '@/core/application/operations';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') return Response.json({ error: 'forbidden' }, { status: 403 });
  return Response.json(await databaseBackup(), { headers: {
    'Cache-Control': 'no-store',
    'Content-Disposition': `attachment; filename="sanctum-backup-${new Date().toISOString().slice(0, 10)}.json"`,
  } });
}
