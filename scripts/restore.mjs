import './register.mjs';
import { readFileSync } from 'node:fs';
import { createClient } from '@libsql/client';
const { restoreSnapshot } = await import('../src/core/infra/backup.ts');
const filename = process.argv[2];
const url = process.env.RESTORE_DATABASE_URL;
if (!filename || !url) throw new Error('Informe o arquivo: npm run restore -- caminho.json; defina RESTORE_DATABASE_URL e, se remoto, RESTORE_AUTH_TOKEN. O destino deve estar vazio.');
if (url === process.env.TURSO_DATABASE_URL) throw new Error('Use um NOVO banco. A restauração no endereço de produção foi recusada.');
const client = createClient({ url, authToken: process.env.RESTORE_AUTH_TOKEN });
try {
  const snapshot = JSON.parse(readFileSync(filename, 'utf8'));
  await restoreSnapshot(client, snapshot);
  console.log('Restauração concluída em banco vazio. Nenhum banco anterior foi apagado. Sessões antigas não foram restauradas.');
} finally { client.close(); }
