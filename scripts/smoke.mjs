// Teste de produção com Chrome real, porta isolada e banco descartável.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import './register.mjs';

const temp = mkdtempSync(path.join(tmpdir(), 'sanctum-browser-'));
const port = 3217;
const origin = `http://localhost:${port}`;
process.env.DATABASE_PATH = path.join(temp, 'smoke.db');
process.env.SETUP_KEY = randomBytes(32).toString('hex');
process.env.HOTMART_HOTTOK = randomBytes(32).toString('hex');
process.env.APP_URL = origin;
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;
delete process.env.RESEND_API_KEY;
delete process.env.NETLIFY;
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', String(port)], { env: { ...process.env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
let logs = '';
child.stdout.on('data', (data) => { logs += data.toString(); });
child.stderr.on('data', (data) => { logs += data.toString(); });
let browser, database;
const password = 'Smoke-test-password-123!';
const screenshotDir = path.resolve('docs/qa');
mkdirSync(screenshotDir, { recursive: true });
try {
  let online = false;
  for (let i = 0; i < 90; i++) {
    if (child.exitCode !== null) throw new Error('Servidor encerrou antes do teste');
    try { const response = await fetch(`${origin}/api/health`); if (response.ok) { online = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  assert.ok(online, 'Servidor deve ficar saudável');
  const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${origin}/`);
  await page.waitForURL('**/setup');
  await page.getByLabel('Chave de instalação').fill(process.env.SETUP_KEY);
  await page.getByLabel('Seu nome').fill('Administrador QA');
  await page.getByLabel('E-mail', { exact: true }).fill('admin@example.test');
  await page.getByLabel('Senha de acesso').fill(password);
  await page.getByRole('button', { name: 'Ativar minha plataforma' }).click();
  await page.waitForURL('**/login*');
  await page.getByLabel('E-mail', { exact: true }).fill('admin@example.test');
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar na Ordem' }).click();
  await page.waitForURL(origin + '/');
  console.log('PASS: instalação e login real');
  await page.goto(`${origin}/admin/cursos/novo`);
  await page.locator('#ce-title').fill('Estudo de demonstração · QA');
  await page.locator('#ce-subtitle').fill('Conteúdo fictício, somente para verificação');
  // Os campos de aula são identificados pelo rótulo adjacente.
  await page.locator('label').filter({ hasText: 'Título da aula *' }).locator('..').locator('input').fill('Uma aula de teste');
  await page.getByLabel('Publicada (visível para alunos)').check();
  await page.getByRole('button', { name: 'Criar trilha', exact: true }).click();
  await page.waitForURL('**/admin/cursos');
  const { ready } = await import('../src/core/infra/db.ts');
  const users = await import('../src/core/infra/repos/users.ts');
  const courses = await import('../src/core/infra/repos/courses.ts');
  const { hashPassword } = await import('../src/core/infra/crypto.ts');
  const { saveMapping } = await import('../src/core/application/hotmart.ts');
  database = await ready();
  const course = (await courses.list())[0];
  assert.equal(course.modules[0].lessons.length, 1);
  await users.create({ name: 'Membro QA', email: 'student@example.test', handle: 'student.qa', role: 'student', passwordHash: hashPassword(password) });
  await saveMapping('90001', '', course.id, 0);
  console.log('PASS: editor criou curso e aula no banco');
  for (const route of ['/', '/admin', '/admin/alunos', '/admin/espacos', '/admin/eventos', '/admin/integracoes', '/admin/operacao', '/community', '/events', '/notifications', '/conta', '/search?q=QA', `/course/${course.id}`]) {
    const response = await page.goto(origin + route);
    assert.equal(response.status(), 200, route);
    assert.ok(!(await page.locator('body').innerText()).includes('Application error'), route);
  }
  await page.goto(origin);
  await page.screenshot({ path: path.join(screenshotDir, 'desktop.png'), fullPage: true });
  const backup = await context.request.get(`${origin}/api/admin/backup`);
  assert.equal(backup.status(), 200);
  assert.equal((await backup.json()).format, 'sanctum-backup-v1');
  console.log('PASS: navegação administrativa e backup autenticado');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/admin', '/admin/cursos', '/admin/alunos', '/admin/espacos', '/admin/eventos', '/admin/integracoes', '/admin/operacao']) {
    await page.goto(origin + route);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false, `Admin mobile: ${route}`);
  }
  console.log('PASS: administração sem overflow em 390px');
  const memberContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1 });
  const member = await memberContext.newPage();
  member.on('pageerror', (error) => errors.push(error.message));
  await member.goto(`${origin}/login`);
  await member.getByLabel('E-mail', { exact: true }).fill('student@example.test');
  await member.getByLabel('Senha', { exact: true }).fill(password);
  await member.getByRole('button', { name: 'Entrar na Ordem' }).click();
  await member.waitForURL(origin + '/');
  await member.goto(`${origin}/course/${course.id}`);
  assert.ok((await member.locator('body').innerText()).includes('precisa de uma matrícula'));
  assert.equal(await member.locator('#lesson-note').count(), 0);
  assert.equal((await memberContext.request.get(`${origin}/api/admin/backup`)).status(), 403);
  await member.goto(`${origin}/admin/alunos`);
  await member.waitForURL(origin + '/');
  const payload = { id: 'smoke-purchase', version: '2.0.0', creation_date: Date.now(), event: 'PURCHASE_APPROVED', data: { product: { id: 90001 }, buyer: { email: 'student@example.test', name: 'Membro QA' }, purchase: { transaction: 'HP-SMOKE', approved_date: Date.now() } } };
  const unauthorized = await fetch(`${origin}/api/webhooks/hotmart`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  assert.equal(unauthorized.status, 401);
  const purchase = await fetch(`${origin}/api/webhooks/hotmart`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-hotmart-hottok': process.env.HOTMART_HOTTOK }, body: JSON.stringify(payload) });
  assert.equal(purchase.status, 200);
  await member.goto(`${origin}/course/${course.id}`);
  await member.locator('#lesson-note').fill('Minha anotação privada de teste.');
  await member.getByRole('button', { name: /Salvar anot/ }).click();
  await member.getByRole('status').filter({ hasText: 'Anotações salvas.' }).waitFor();
  await member.reload();
  assert.equal(await member.locator('#lesson-note').inputValue(), 'Minha anotação privada de teste.');
  await member.getByRole('button', { name: /Concluir aula|Marcar como concluída/ }).click();
  await member.getByText('Aula concluída', { exact: true }).waitFor();
  await member.goto(`${origin}/certificates`);
  await member.getByRole('link', { name: /Abrir certificado/ }).click();
  assert.ok((await member.locator('body').innerText()).includes('Membro QA'));
  console.log('PASS: aluno bloqueado, webhook HTTP autenticado, notas e certificado');
  for (const route of ['/', '/meus-cursos', '/community', '/conta', `/course/${course.id}`]) {
    await member.goto(origin + route);
    const overflow = await member.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert.equal(overflow, false, `Sem overflow mobile em ${route}`);
  }
  await member.goto(origin);
  await member.screenshot({ path: path.join(screenshotDir, 'mobile.png'), fullPage: true });
  assert.equal(errors.length, 0, errors.join('\n'));
  const anonymous = await browser.newContext();
  const invalid = await anonymous.newPage();
  await anonymous.addCookies([{ name: 'sanctum_session', value: 'invalid', domain: 'localhost', path: '/' }]);
  await invalid.goto(origin);
  await invalid.waitForURL('**/login');
  assert.equal((await anonymous.request.get(`${origin}/api/webhooks/hotmart`)).status(), 405);
  console.log('PASS: mobile 390px, sem erros JS, cookie inválido sem loop');
  console.log('Smoke completo. Dados fictícios foram isolados; nenhuma mensagem externa enviada.');
} catch (error) {
  console.error(logs.slice(-6000));
  throw error;
} finally {
  await browser?.close();
  database?.close();
  child.kill();
  await new Promise((resolve) => child.exitCode !== null ? resolve() : child.once('exit', resolve));
  const resolved = path.resolve(temp);
  assert.ok(resolved.startsWith(path.resolve(tmpdir()) + path.sep) && path.basename(resolved).startsWith('sanctum-browser-'));
  try { rmSync(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); }
  catch (error) { if (!['EPERM', 'EBUSY'].includes(error.code)) throw error; }
}
