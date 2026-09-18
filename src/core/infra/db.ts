import { createClient, type Client, type Transaction, type InValue, type InStatement } from '@libsql/client';
import { AsyncLocalStorage } from 'node:async_hooks';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { SCHEMA } from './schema';
import { seedCatalog } from './seed';

const context = new AsyncLocalStorage<Transaction>();
const globalDb = globalThis as unknown as { __sanctumClient?: Client; __sanctumReady?: Promise<Client> };
const SCHEMA_VERSION = 1;

function client(): Client {
  if (globalDb.__sanctumClient) return globalDb.__sanctumClient;
  let url = process.env.TURSO_DATABASE_URL;
  if (url?.startsWith('file:') && (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME)) throw new Error('Banco local não é persistente no Netlify. Use libsql:// do Turso.');
  if (!url) {
    if (process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) throw new Error('Configure TURSO_DATABASE_URL e TURSO_AUTH_TOKEN antes de ativar.');
    const filename = path.resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH || 'data/sanctum.db');
    mkdirSync(/* turbopackIgnore: true */ path.dirname(filename), { recursive: true });
    url = `file:${filename.replaceAll('\\', '/')}`;
  }
  if (process.env.NODE_ENV === 'production' && process.env.DEMO_MODE === 'true') throw new Error('Dados de demonstração não são permitidos em produção.');
  globalDb.__sanctumClient = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return globalDb.__sanctumClient;
}

async function initialize(): Promise<Client> {
  const db = client();
  const migrationTable = await db.execute("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='schema_migrations'");
  if (migrationTable.rows.length) {
    const migration = await db.execute({ sql: 'SELECT 1 FROM schema_migrations WHERE version = ?', args: [SCHEMA_VERSION] });
    if (migration.rows.length) return db;
  }
  const tx = await db.transaction('write');
  try {
    await tx.executeMultiple(SCHEMA);
    await tx.execute('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
    const addColumn = async (table: string, name: string, definition: string) => {
      const columns = await tx.execute(`PRAGMA table_info(${table})`);
      if (!columns.rows.some((r) => r.name === name)) await tx.execute(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
    };
    await addColumn('users', 'status', "TEXT NOT NULL DEFAULT 'active'");
    await addColumn('courses', 'access', "TEXT NOT NULL DEFAULT 'enrollment'");
    await addColumn('courses', 'checkout_url', "TEXT NOT NULL DEFAULT ''");
    await addColumn('enrollments', 'expires_at', 'TEXT');
    await addColumn('enrollments', 'manual_access', 'INTEGER NOT NULL DEFAULT 1');
    await addColumn('enrollments', 'blocked', 'INTEGER NOT NULL DEFAULT 0');
    await addColumn('certificates', 'recipient_name', "TEXT NOT NULL DEFAULT ''");
    await addColumn('certificates', 'course_title', "TEXT NOT NULL DEFAULT ''");
    await tx.executeMultiple(`
      CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS password_tokens (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS lesson_notes (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE, content TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(user_id, lesson_id));
      CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY, actor_id TEXT, action TEXT NOT NULL, target_id TEXT, created_at TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_rate_expiry ON rate_limits(reset_at);
      CREATE INDEX IF NOT EXISTS idx_password_expiry ON password_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS idx_enrollment_course ON enrollments(course_id);
      CREATE TABLE IF NOT EXISTS hotmart_products (id TEXT PRIMARY KEY, product_id TEXT NOT NULL, offer_code TEXT NOT NULL DEFAULT '', course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE, access_days INTEGER NOT NULL DEFAULT 0, UNIQUE(product_id, offer_code, course_id));
      CREATE TABLE IF NOT EXISTS hotmart_events (id TEXT PRIMARY KEY, event TEXT NOT NULL, transaction_id TEXT, product_id TEXT NOT NULL, created_at INTEGER NOT NULL, processed_at TEXT NOT NULL, outcome TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS hotmart_purchases (transaction_id TEXT PRIMARY KEY, product_id TEXT NOT NULL, user_id TEXT REFERENCES users(id), subscriber_code TEXT, status TEXT NOT NULL, event_at INTEGER NOT NULL, approved_at TEXT, expires_at TEXT);
      CREATE TABLE IF NOT EXISTS access_grants (transaction_id TEXT NOT NULL REFERENCES hotmart_purchases(transaction_id), user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE, expires_at TEXT, revoked INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(transaction_id, course_id));
      CREATE INDEX IF NOT EXISTS idx_grant_user_course ON access_grants(user_id, course_id, revoked);
      CREATE INDEX IF NOT EXISTS idx_purchase_subscriber ON hotmart_purchases(subscriber_code, product_id);
      CREATE TABLE IF NOT EXISTS hotmart_subscriptions (subscriber_code TEXT NOT NULL, product_id TEXT NOT NULL, event_at INTEGER NOT NULL, canceled_at TEXT NOT NULL, paid_until TEXT, PRIMARY KEY(subscriber_code, product_id));
    `);
    await context.run(tx, () => seedCatalog(getDb()));
    await tx.execute({ sql: 'INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, ?)', args: [SCHEMA_VERSION, new Date().toISOString()] });
    await tx.commit();
    return db;
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally { tx.close(); }
}

export function ready(): Promise<Client> {
  if (!globalDb.__sanctumReady) {
    globalDb.__sanctumReady = initialize().catch((error) => {
      globalDb.__sanctumReady = undefined;
      throw error;
    });
  }
  return globalDb.__sanctumReady;
}

async function execute(sql: string, args: InValue[] = []) {
  const executor = context.getStore() ?? await ready();
  return executor.execute({ sql, args });
}

/** Mesmo contrato local/HTTP. Nenhum dado persistido no disco efêmero do Netlify. */
export function getDb() {
  return {
    async batch(statements: InStatement[]) {
      const executor = context.getStore() ?? await ready();
      return executor.batch(statements);
    },
    prepare(sql: string) {
      return {
        async all(...args: InValue[]) { return (await execute(sql, args)).rows as unknown as Record<string, unknown>[]; },
        async get(...args: InValue[]) { return (await execute(sql, args)).rows[0] as unknown as Record<string, unknown> | undefined; },
        async run(...args: InValue[]) { const result = await execute(sql, args); return { changes: result.rowsAffected }; },
      };
    },
    async exec(sql: string) {
      const executor = context.getStore() ?? await ready();
      await executor.executeMultiple(sql);
    },
  };
}

export async function transaction<T>(fn: () => Promise<T>): Promise<T> {
  if (context.getStore()) return fn();
  const db = await ready();
  const tx = await db.transaction('write');
  try {
    const result = await context.run(tx, fn);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally { tx.close(); }
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
}
