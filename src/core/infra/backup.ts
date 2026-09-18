import type { Client, InValue } from '@libsql/client';

export type Snapshot = { format: 'sanctum-backup-v1'; createdAt: string; version: number; schema: string[]; tables: Record<string, Record<string, InValue>[]> };
const transient = new Set(['sessions', 'password_tokens', 'rate_limits']);
const identifier = (name: string) => { if (!/^[a-z_][a-z_0-9]*$/i.test(name)) throw new Error('Invalid identifier'); return `"${name}"`; };

export async function createSnapshot(client: Client): Promise<Snapshot> {
  const tx = await client.transaction('read');
  try {
    const schema = await tx.execute("SELECT type,name,sql FROM sqlite_schema WHERE type IN ('table','index') AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END, rowid");
    const migrations = schema.rows.some((row) => row.type === 'table' && row.name === 'schema_migrations');
    const version = migrations ? Number((await tx.execute('SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations')).rows[0].version) : 0;
    const tables: Snapshot['tables'] = {};
    for (const row of schema.rows.filter((row) => row.type === 'table')) {
      const name = String(row.name);
      tables[name] = transient.has(name) ? [] : (await tx.execute(`SELECT * FROM ${identifier(name)}`)).rows as unknown as Record<string, InValue>[];
    }
    await tx.commit();
    return { format: 'sanctum-backup-v1', createdAt: new Date().toISOString(), version, schema: schema.rows.map((row) => String(row.sql)), tables };
  } catch (error) { await tx.rollback(); throw error; } finally { tx.close(); }
}

/** Restaura somente em banco vazio. Nunca apaga ou substitui o banco atual. */
export async function restoreSnapshot(client: Client, snapshot: Snapshot): Promise<void> {
  if (snapshot.format !== 'sanctum-backup-v1' || !Array.isArray(snapshot.schema) || !snapshot.tables || !Number.isInteger(snapshot.version)) throw new Error('Backup inválido');
  const tx = await client.transaction('write');
  try {
    if ((await tx.execute("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'")).rows.length) throw new Error('Restauração recusada: o banco de destino precisa estar vazio.');
    for (const sql of snapshot.schema) {
      if (!/^CREATE (TABLE|(?:UNIQUE )?INDEX) /i.test(sql.trim())) throw new Error('Schema inválido');
      await tx.execute(sql);
    }
    for (const [table, rows] of Object.entries(snapshot.tables)) {
      if (transient.has(table)) continue;
      for (let offset = 0; offset < rows.length; offset += 100) {
        await tx.batch(rows.slice(offset, offset + 100).map((row) => {
          const columns = Object.keys(row);
          return { sql: `INSERT INTO ${identifier(table)} (${columns.map(identifier).join(',')}) VALUES (${columns.map(() => '?').join(',')})`, args: columns.map((key) => row[key]) };
        }));
      }
    }
    if ((await tx.execute('PRAGMA foreign_key_check')).rows.length) throw new Error('Backup com referências inválidas');
    await tx.execute('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
    if (snapshot.version > 0) await tx.execute({ sql: 'INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, ?)', args: [snapshot.version, snapshot.createdAt] });
    await tx.commit();
  } catch (error) { await tx.rollback(); throw error; } finally { tx.close(); }
}
