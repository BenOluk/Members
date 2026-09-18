import { test, after } from 'node:test';
import { createClient } from '@libsql/client';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const temp = mkdtempSync(path.join(tmpdir(), 'sanctum-test-'));
process.env.DATABASE_PATH = path.join(temp, 'test.db');
delete process.env.TURSO_DATABASE_URL;
process.env.SETUP_KEY = 'test-only-installation-key-0123456789abcdef';
process.env.HOTMART_HOTTOK = 'test-only-hottok';
const { getDb, transaction, ready } = await import('../src/core/infra/db.ts');
const { installAdmin, needsSetup } = await import('../src/core/application/installation.ts');
const users = await import('../src/core/infra/repos/users.ts');
const courses = await import('../src/core/infra/repos/courses.ts');
const { hashPassword, hashSessionToken, verifyPassword } = await import('../src/core/infra/crypto.ts');
const { finishLesson, saveNote, lessonNote, enrollMember } = await import('../src/core/application/learning.ts');
const { issuePasswordReset, resetPassword } = await import('../src/core/application/account.ts');
const { processHotmart, saveMapping, validHottok } = await import('../src/core/application/hotmart.ts');
const { canStudy } = await import('../src/core/domain/access.ts');
const { consumeLimit } = await import('../src/core/infra/security.ts');
const { videoSource } = await import('../src/core/domain/media.ts');
const { validateCourseDraft } = await import('../src/core/domain/course-validation.ts');
const session = await import('../src/core/infra/repos/sessions.ts');
let admin, student, draft, courseId, lessonId;

after(async () => {
  (await ready()).close();
  // Windows pode manter o arquivo nativo aberto até o término do processo.
  const resolved = path.resolve(temp);
  assert.ok(resolved.startsWith(path.resolve(tmpdir()) + path.sep) && path.basename(resolved).startsWith('sanctum-test-'));
  try { rmSync(resolved, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); }
  catch (error) { if (!['EPERM', 'EBUSY'].includes(error.code)) throw error; }
});

test('instalação vazia: sem senha ou conteúdo de demonstração; chave obrigatória e uso único', async () => {
  assert.equal(await needsSetup(), true);
  assert.equal((await courses.list()).length, 0);
  const input = { key: process.env.SETUP_KEY, name: 'Administrador de teste', email: 'admin@example.test', password: 'long-password-for-test' };
  assert.equal(await installAdmin({ ...input, key: 'incorrect' }), false);
  assert.equal(await installAdmin(input), true);
  assert.equal(await installAdmin(input), false);
  admin = (await users.list())[0];
  student = await users.create({ name: 'Aluno', email: 'student@example.test', handle: 'student', role: 'student', passwordHash: hashPassword('password-for-test') });
  draft = { title: 'Trilha de teste', subtitle: '', description: '', thumbnail: '/course-cover.svg', coverImage: '/course-cover.svg', categoryId: 'livre', instructorId: admin.id, tags: [], level: 'introdutorio', featured: false, isPublished: true, access: 'enrollment', modules: [{ title: 'Módulo', lessons: [{ title: 'Aula', description: '', videoUrl: '', duration: 60, xpReward: 50, resources: [{ id: '', kind: 'pdf', title: 'Material', url: 'https://example.test/file.pdf' }] }] }] };
  assert.equal(validateCourseDraft(draft), null);
  courseId = await courses.save(draft);
  const course = await courses.getById(courseId);
  lessonId = course.modules[0].lessons[0].id;
  assert.equal(course.modules[0].lessons[0].resources.length, 1);
});

test('aluno não pode se matricular, concluir ou anotar em trilha restrita sem acesso', async () => {
  assert.equal(await enrollMember(student.id, courseId), false);
  assert.equal(await finishLesson(student.id, courseId, lessonId), false);
  assert.equal(await saveNote(student.id, courseId, lessonId, 'privado'), false);
  assert.equal((await users.getById(student.id)).xp, 0);
});

test('conclusão é idempotente, emite certificado e notas ficam separadas por usuário', async () => {
  await courses.createEnrollment(student.id, courseId);
  assert.equal(await finishLesson(student.id, courseId, lessonId), true);
  assert.equal(await finishLesson(student.id, courseId, lessonId), false);
  assert.equal((await users.getById(student.id)).xp, 50);
  assert.equal((await getDb().prepare('SELECT COUNT(*) AS n FROM certificates WHERE user_id=?').get(student.id)).n, 1);
  assert.equal(await saveNote(student.id, courseId, lessonId, 'minha nota'), true);
  assert.equal(await lessonNote(student.id, lessonId), 'minha nota');
  assert.equal(await lessonNote(admin.id, lessonId), '');
  await courses.removeEnrollment(student.id, courseId);
  assert.equal(canStudy(await users.getById(student.id), await courses.getById(courseId), await courses.getEnrollment(student.id, courseId)), false);
  assert.equal(await saveNote(student.id, courseId, lessonId, 'acesso revogado'), false);
});

test('rollback preserva integridade quando uma etapa falha', async () => {
  const before = (await users.getById(student.id)).xp;
  await assert.rejects(transaction(async () => { await users.addXp(student.id, 999); throw new Error('falha injetada'); }));
  assert.equal((await users.getById(student.id)).xp, before);
});

test('limite de tentativas persiste no banco e expira', async () => {
  assert.equal(await consumeLimit('test-limit', 2, 1000, 100), true);
  assert.equal(await consumeLimit('test-limit', 2, 1000, 200), true);
  assert.equal(await consumeLimit('test-limit', 2, 1000, 300), false);
  assert.equal(await consumeLimit('test-limit', 2, 1000, 1200), true);
});

test('token de recuperação é exclusivo do admin, expira, usa uma vez e revoga sessões', async () => {
  assert.equal(await issuePasswordReset(student.id, admin.id), null);
  await session.create(hashSessionToken('fake-session'), student.id, new Date(Date.now() + 60000).toISOString());
  const token = await issuePasswordReset(admin.id, student.id);
  assert.equal(await resetPassword(token, 'x'), false);
  assert.equal(await resetPassword(token, 'replacement-password-123'), true);
  assert.equal(await resetPassword(token, 'replacement-password-123'), false);
  assert.equal(await session.getUserId(hashSessionToken('fake-session')), undefined);
  assert.equal(verifyPassword('replacement-password-123', (await users.getAuthByEmail(student.email)).passwordHash), true);
  const expired = await issuePasswordReset(admin.id, student.id);
  await getDb().prepare('UPDATE password_tokens SET expires_at=? WHERE user_id=?').run('2000-01-01T00:00:00.000Z', student.id);
  assert.equal(await resetPassword(expired, 'replacement-password-123'), false);
});

test('player e validação recusam protocolos ativos, IDs inválidos e payloads malformados', () => {
  assert.equal(videoSource('javascript:alert(1)'), null);
  assert.equal(videoSource('https://evil.test/embed'), null);
  assert.equal(videoSource('https://youtu.be/12345678901').kind, 'embed');
  assert.equal(videoSource('https://vimeo.com/123456/abcdef').url, 'https://player.vimeo.com/video/123456?h=abcdef');
  assert.ok(validateCourseDraft({ ...draft, thumbnail: 'javascript:alert(1)' }));
  assert.ok(validateCourseDraft({ ...draft, modules: null }));
});

let counter = 0;
const baseTime = Date.now();
function webhook(event, transactionId, extra = {}) {
  return { id: `event-${++counter}`, version: '2.0.0', creation_date: baseTime + counter * 1000, event, data: { product: { id: 12345 }, buyer: { email: 'buyer@example.test', name: 'Comprador' }, purchase: { transaction: transactionId, approved_date: baseTime, offer: { code: 'offer' } }, ...extra } };
}

test('Hotmart: token correto, formato 2.0.0 e mapeamento são obrigatórios', async () => {
  assert.equal(validHottok('wrong'), false); assert.equal(validHottok(process.env.HOTMART_HOTTOK), true);
  assert.equal((await processHotmart({})).status, 400);
  const event = webhook('PURCHASE_APPROVED', 'HP-1');
  assert.equal((await processHotmart(event)).status, 422);
  assert.equal(await saveMapping('12345', '', courseId, 0), true);
  assert.equal((await processHotmart(event)).outcome, 'granted');
  assert.equal((await processHotmart(event)).outcome, 'duplicate');
  const buyer = (await users.list()).find((u) => u.email === 'buyer@example.test');
  assert.equal(canStudy(buyer, await courses.getById(courseId), await courses.getEnrollment(buyer.id, courseId)), true);
  assert.equal((await users.list()).filter((u) => u.email === buyer.email).length, 1);
});

test('Hotmart: reembolso revoga só sua compra e aprovação antiga não restaura acesso', async () => {
  const buyer = (await users.list()).find((u) => u.email === 'buyer@example.test');
  const second = webhook('PURCHASE_APPROVED', 'HP-2'); await processHotmart(second);
  const refund = webhook('PURCHASE_REFUNDED', 'HP-1'); await processHotmart(refund);
  assert.equal(canStudy(buyer, await courses.getById(courseId), await courses.getEnrollment(buyer.id, courseId)), true);
  const replay = webhook('PURCHASE_APPROVED', 'HP-1'); replay.creation_date = refund.creation_date - 1;
  assert.equal((await processHotmart(replay)).outcome, 'stale');
  await processHotmart(webhook('PURCHASE_CHARGEBACK', 'HP-2'));
  assert.equal(canStudy(buyer, await courses.getById(courseId), await courses.getEnrollment(buyer.id, courseId)), false);
  await courses.createEnrollment(buyer.id, courseId);
  await processHotmart(webhook('PURCHASE_REFUNDED', 'HP-2'));
  assert.equal(canStudy(buyer, await courses.getById(courseId), await courses.getEnrollment(buyer.id, courseId)), true);
});

test('Hotmart: assinatura exige vencimento; cancelamento preserva período pago e renovação usa nova transação', async () => {
  const subscription = { subscriber: { code: 'SUB-1' } };
  const invalid = webhook('PURCHASE_APPROVED', 'HP-SUB', { subscription });
  assert.equal((await processHotmart(invalid)).outcome, 'subscription_missing_paid_until');
  const end = Date.now() + 30 * 86400000;
  invalid.data.purchase.date_next_charge = end;
  assert.equal((await processHotmart(invalid)).outcome, 'granted');
  const cancel = webhook('SUBSCRIPTION_CANCELLATION', '', { subscriber: { code: 'SUB-1', email: 'buyer@example.test' }, date_next_charge: end });
  assert.equal((await processHotmart(cancel)).outcome, 'canceled_at_period_end');
  const grant = await getDb().prepare('SELECT * FROM access_grants WHERE transaction_id=?').get('HP-SUB');
  assert.equal(grant.revoked, 0); assert.equal(grant.expires_at, new Date(end).toISOString());
  const renew = webhook('PURCHASE_APPROVED', 'HP-SUB-2', { subscription }); renew.data.purchase.date_next_charge = end + 30 * 86400000;
  assert.equal((await processHotmart(renew)).outcome, 'granted');
});

test('backup restaura em banco vazio, preserva dados e não restaura sessões ou tokens', async () => {
  const { createSnapshot, restoreSnapshot } = await import('../src/core/infra/backup.ts');
  const snapshot = await createSnapshot(await ready());
  assert.equal(snapshot.tables.users.length, (await users.list()).length);
  assert.equal(snapshot.tables.sessions.length, 0);
  assert.equal(snapshot.tables.password_tokens.length, 0);
  const target = createClient({ url: `file:${path.join(temp, 'restored.db').replaceAll('\\', '/')}` });
  try {
    await restoreSnapshot(target, snapshot);
    assert.equal((await target.execute('SELECT COUNT(*) AS n FROM users')).rows[0].n, snapshot.tables.users.length);
    assert.equal((await target.execute('PRAGMA foreign_key_check')).rows.length, 0);
    await assert.rejects(restoreSnapshot(target, snapshot), /vazio/);
    assert.equal((await target.execute('SELECT COUNT(*) AS n FROM users')).rows[0].n, snapshot.tables.users.length);
  } finally { target.close(); }
});

test('comunidade: busca, perfil e feed não expõem posts de espaços restritos', async () => {
  const community = await import('../src/core/infra/repos/community.ts');
  const { listVisiblePosts } = await import('../src/core/application/community.ts');
  const { globalSearch } = await import('../src/core/application/search.ts');
  await community.saveSpace({ name: 'Restrito QA', description: '', icon: '◇', visibility: 'premium', categoryLabel: 'Estudos' });
  const space = (await community.listSpaces()).find((s) => s.name === 'Restrito QA');
  await getDb().prepare('INSERT INTO posts (id,space_id,author_id,content,created_at) VALUES (?,?,?,?,?)').run('private-post', space.id, admin.id, 'segredoqatest', new Date().toISOString());
  assert.ok((await listVisiblePosts(admin)).some((p) => p.id === 'private-post'));
  assert.ok(!(await listVisiblePosts(student)).some((p) => p.id === 'private-post'));
  assert.equal((await globalSearch('segredoqatest', student)).posts.length, 0);
});

test('e-mail de acesso: envio simulado, resposta genérica, token utilizável e falha auditada', async (t) => {
  const { requestAccessEmail } = await import('../src/core/application/account.ts');
  const old = { RESEND_API_KEY: process.env.RESEND_API_KEY, EMAIL_FROM: process.env.EMAIL_FROM, APP_URL: process.env.APP_URL };
  process.env.RESEND_API_KEY = 'test-never-real'; process.env.EMAIL_FROM = 'Sanctum <test@example.test>'; process.env.APP_URL = 'https://example.test';
  const requests = [];
  const mock = t.mock.method(globalThis, 'fetch', async (url, options) => { requests.push({ url, options }); return new Response('{}', { status: 200 }); });
  try {
    assert.equal(await requestAccessEmail(student.email), undefined);
    assert.equal(requests.length, 1);
    const body = JSON.parse(requests[0].options.body);
    assert.equal(body.to[0], student.email);
    const token = body.text.match(/token=([a-f0-9]{64})/)[1];
    assert.equal(await resetPassword(token, 'emailed-password-12345'), true);
    assert.equal(await requestAccessEmail('absent@example.test'), undefined);
    assert.equal(requests.length, 1);
    mock.mock.mockImplementation(async () => new Response('{}', { status: 500 }));
    await requestAccessEmail(student.email);
    assert.equal((await getDb().prepare('SELECT COUNT(*) AS n FROM password_tokens WHERE user_id=?').get(student.id)).n, 0);
    assert.ok(await getDb().prepare("SELECT 1 FROM audit_log WHERE action='email.access_failed' AND target_id=?").get(student.id));
  } finally { mock.mock.restore(); for (const [key, value] of Object.entries(old)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
});

test('Hotmart: reembolso antes de aprovação não ressuscita a mesma transação', async () => {
  const refund = webhook('PURCHASE_REFUNDED', 'HP-OUT-OF-ORDER');
  assert.equal((await processHotmart(refund)).status, 200);
  const approval = webhook('PURCHASE_APPROVED', 'HP-OUT-OF-ORDER');
  assert.notEqual((await processHotmart(approval)).outcome, 'granted');
  assert.equal((await getDb().prepare('SELECT * FROM access_grants WHERE transaction_id=?').all('HP-OUT-OF-ORDER')).length, 0);
});

test('a exclusão de módulo remove aulas e materiais por integridade referencial', async () => {
  const id = await courses.save({ ...draft, title: 'Trilha descartável QA' });
  const course = await courses.getById(id);
  const mid = course.modules[0].id;
  const lid = course.modules[0].lessons[0].id;
  await getDb().prepare('DELETE FROM modules WHERE id=?').run(mid);
  assert.equal(await getDb().prepare('SELECT id FROM lessons WHERE id=?').get(lid), undefined);
  assert.equal((await getDb().prepare('SELECT id FROM lesson_resources WHERE lesson_id=?').all(lid)).length, 0);
});
