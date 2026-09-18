import './register.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const { ready } = await import('../src/core/infra/db.ts');
const { createSnapshot } = await import('../src/core/infra/backup.ts');
const database = await ready();
try {
  const snapshot = await createSnapshot(database);
  const filename = path.resolve('backups', `sanctum-${new Date().toISOString().replaceAll(':', '-')}.json`);
  mkdirSync(path.dirname(filename), { recursive: true });
  writeFileSync(filename, JSON.stringify(snapshot), { flag: 'wx', mode: 0o600 });
  console.log(`Backup criado: ${filename}\nContém dados pessoais e hashes de senhas. Guarde em local criptografado.`);
} finally { database.close(); }
