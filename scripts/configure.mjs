import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
if (existsSync('.env.local')) {
  console.log('.env.local já existe; nada foi substituído. Consulte .env.example para novos campos.');
} else {
  const template = readFileSync('.env.example', 'utf8');
  writeFileSync('.env.local', template.replace('SETUP_KEY=\n', `SETUP_KEY=${randomBytes(32).toString('hex')}\n`), { flag: 'wx', mode: 0o600 });
  console.log('Criado .env.local, ignorado pelo Git. Abra esse arquivo para consultar a chave de instalação. Não a compartilhe no chat.');
}
