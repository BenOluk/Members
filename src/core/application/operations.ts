import { getDb, ready } from '../infra/db';
import { emailConfigured } from '../infra/email';
import { createSnapshot } from '../infra/backup';
export const accessEmailEnabled = emailConfigured;
export async function operationStatus() {
  const database = await ready();
  await database.execute('SELECT 1');
  return {
    remote: Boolean(process.env.TURSO_DATABASE_URL && !process.env.TURSO_DATABASE_URL.startsWith('file:')),
    hotmart: Boolean(process.env.HOTMART_HOTTOK),
    email: emailConfigured(),
    origin: process.env.APP_URL || '',
    audit: await getDb().prepare('SELECT action,target_id,created_at FROM audit_log ORDER BY created_at DESC LIMIT 30').all(),
  };
}
export async function databaseBackup() { return createSnapshot(await ready()); }
