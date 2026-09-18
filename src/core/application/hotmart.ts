import { timingSafeEqual } from 'node:crypto';
import { parseHotmartEvent, HOTMART_EVENTS } from '../domain/hotmart';
import { getDb, newId, transaction } from '../infra/db';
import { hashPassword, hashSessionToken, newSessionToken } from '../infra/crypto';
import * as users from '../infra/repos/users';
import * as courses from '../infra/repos/courses';
import { audit } from '../infra/security';

export interface ProductMapping { id: string; product_id: string; offer_code: string; course_id: string; access_days: number }
interface Purchase { transaction_id: string; product_id: string; user_id: string | null; status: string; event_at: number; expires_at: string | null; approved_at: string | null }
export interface WebhookResult { status: number; outcome: string; userId?: string; newMember?: boolean }

export function validHottok(received: string | null): boolean {
  const expected = process.env.HOTMART_HOTTOK;
  return Boolean(expected && received && timingSafeEqual(Buffer.from(hashSessionToken(received)), Buffer.from(hashSessionToken(expected))));
}

export async function processHotmart(value: unknown): Promise<WebhookResult> {
  const event = parseHotmartEvent(value);
  if (!event) return { status: 400, outcome: 'invalid_payload' };
  if (!HOTMART_EVENTS.includes(event.event as typeof HOTMART_EVENTS[number])) return { status: 200, outcome: 'ignored_event' };
  return transaction(async () => {
    const db = getDb();
    if (await db.prepare('SELECT 1 FROM hotmart_events WHERE id=?').get(event.id)) return { status: 200, outcome: 'duplicate' };
    if (!await db.prepare("SELECT 1 FROM users WHERE role='admin' AND status='active' LIMIT 1").get()) return { status: 503, outcome: 'setup_required' };
    const recordEvent = async (outcome: string) => {
      await db.prepare('INSERT INTO hotmart_events (id,event,transaction_id,product_id,created_at,processed_at,outcome) VALUES (?,?,?,?,?,?,?)')
        .run(event.id, event.event, event.transactionId, event.productId, event.createdAt, new Date().toISOString(), outcome);
    };
    if (event.event === 'SUBSCRIPTION_CANCELLATION') {
      const prior = await db.prepare('SELECT event_at FROM hotmart_subscriptions WHERE subscriber_code=? AND product_id=?').get(event.subscriberCode, event.productId) as { event_at: number } | undefined;
      if (!prior || prior.event_at < event.createdAt) {
        await db.prepare(`INSERT INTO hotmart_subscriptions (subscriber_code,product_id,event_at,canceled_at,paid_until) VALUES (?,?,?,?,?)
          ON CONFLICT(subscriber_code,product_id) DO UPDATE SET event_at=excluded.event_at,canceled_at=excluded.canceled_at,paid_until=excluded.paid_until`)
          .run(event.subscriberCode, event.productId, event.createdAt, new Date(event.createdAt).toISOString(), event.paidUntil);
        // Só encurta o período existente; um cancelamento nunca concede novo acesso.
        if (event.paidUntil) await db.prepare(`UPDATE access_grants SET expires_at=CASE WHEN expires_at IS NULL OR expires_at>? THEN ? ELSE expires_at END
          WHERE transaction_id IN (SELECT transaction_id FROM hotmart_purchases WHERE subscriber_code=? AND product_id=? AND event_at<=?)`)
          .run(event.paidUntil, event.paidUntil, event.subscriberCode, event.productId, event.createdAt);
      }
      await recordEvent('canceled_at_period_end');
      return { status: 200, outcome: 'canceled_at_period_end' };
    }
    const existing = await db.prepare('SELECT * FROM hotmart_purchases WHERE transaction_id=?').get(event.transactionId) as unknown as Purchase | undefined;
    if (existing && existing.product_id !== event.productId) return { status: 409, outcome: 'transaction_product_conflict' };
    const revocation = ['PURCHASE_REFUNDED', 'PURCHASE_CHARGEBACK', 'PURCHASE_PROTEST', 'PURCHASE_CANCELED', 'PURCHASE_EXPIRED'].includes(event.event);
    const approval = ['PURCHASE_APPROVED', 'PURCHASE_COMPLETE'].includes(event.event);
    const terminal = existing && ['PURCHASE_REFUNDED', 'PURCHASE_CHARGEBACK'].includes(existing.status);
    if (existing && (existing.event_at > event.createdAt || (existing.event_at === event.createdAt && !revocation) || (terminal && approval))) {
      await recordEvent('stale');
      return { status: 200, outcome: 'stale' };
    }
    if (!approval) {
      if (revocation) {
        await db.prepare(`INSERT INTO hotmart_purchases (transaction_id,product_id,user_id,subscriber_code,status,event_at) VALUES (?,?,NULL,?,?,?)
          ON CONFLICT(transaction_id) DO UPDATE SET status=excluded.status,event_at=excluded.event_at`)
          .run(event.transactionId, event.productId, event.subscriberCode, event.event, event.createdAt);
        await db.prepare('UPDATE access_grants SET revoked=1 WHERE transaction_id=?').run(event.transactionId);
      }
      // Atraso não estende o período pago e não revoga outras compras.
      await recordEvent(revocation ? 'revoked' : 'no_extension');
      return { status: 200, outcome: revocation ? 'revoked' : 'no_extension' };
    }
    const mappings = await db.prepare(`SELECT * FROM hotmart_products WHERE product_id=? AND (offer_code='' OR offer_code=?)`)
      .all(event.productId, event.offerCode) as unknown as ProductMapping[];
    if (!mappings.length) return { status: 422, outcome: 'product_not_mapped' };
    if (event.subscriberCode && !event.paidUntil) return { status: 422, outcome: 'subscription_missing_paid_until' };
    const auth = await db.prepare('SELECT id FROM users WHERE email=? COLLATE NOCASE').get(event.email) as { id: string } | undefined;
    const member = auth ? await users.getById(auth.id) : await users.create({ name: event.name || 'Membro', email: event.email, passwordHash: hashPassword(newSessionToken()), handle: newId('membro'), role: 'student' });
    if (!member) throw new Error('Member creation failed');
    if (existing?.user_id && existing.user_id !== member.id) throw new Error('Transaction identity mismatch');
    const approvedAt = existing?.approved_at ?? event.approvedAt ?? new Date(event.createdAt).toISOString();
    await db.prepare(`INSERT INTO hotmart_purchases (transaction_id,product_id,user_id,subscriber_code,status,event_at,approved_at,expires_at) VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(transaction_id) DO UPDATE SET user_id=excluded.user_id,status=excluded.status,event_at=excluded.event_at,expires_at=excluded.expires_at`)
      .run(event.transactionId, event.productId, member.id, event.subscriberCode, event.event, event.createdAt, approvedAt, event.paidUntil);
    const cancellation = event.subscriberCode ? await db.prepare('SELECT event_at,paid_until FROM hotmart_subscriptions WHERE subscriber_code=? AND product_id=?').get(event.subscriberCode, event.productId) as { event_at: number; paid_until: string | null } | undefined : undefined;
    // Uma regra específica de oferta substitui a genérica para a mesma trilha.
    const selected = new Map<string, ProductMapping>();
    for (const mapping of mappings.sort((a, b) => a.offer_code.length - b.offer_code.length)) selected.set(mapping.course_id, mapping);
    for (const mapping of selected.values()) {
      let expiresAt = event.subscriberCode ? event.paidUntil : mapping.access_days ? new Date(Date.parse(approvedAt) + mapping.access_days * 86400000).toISOString() : null;
      if (cancellation && cancellation.event_at >= event.createdAt && cancellation.paid_until && (!expiresAt || cancellation.paid_until < expiresAt)) expiresAt = cancellation.paid_until;
      await courses.createEnrollment(member.id, mapping.course_id, false);
      await db.prepare(`INSERT INTO access_grants (transaction_id,user_id,course_id,expires_at,revoked) VALUES (?,?,?,?,0)
        ON CONFLICT(transaction_id,course_id) DO UPDATE SET expires_at=excluded.expires_at,revoked=0`)
        .run(event.transactionId, member.id, mapping.course_id, expiresAt);
    }
    await audit(null, 'hotmart.access_granted', event.transactionId);
    await recordEvent('granted');
    return { status: 200, outcome: 'granted', userId: member.id, newMember: !auth };
  });
}

export async function listMappings(): Promise<ProductMapping[]> {
  return await getDb().prepare('SELECT * FROM hotmart_products ORDER BY product_id,offer_code').all() as unknown as ProductMapping[];
}

export async function recentWebhookEvents() {
  return getDb().prepare('SELECT id,event,product_id,processed_at,outcome FROM hotmart_events ORDER BY processed_at DESC LIMIT 50').all();
}

export async function saveMapping(productId: string, offerCode: string, courseId: string, accessDays: number): Promise<boolean> {
  if (!/^\d{1,30}$/.test(productId) || offerCode.length > 200 || !Number.isInteger(accessDays) || accessDays < 0 || accessDays > 36500 || !await courses.getById(courseId)) return false;
  await getDb().prepare(`INSERT INTO hotmart_products (id,product_id,offer_code,course_id,access_days) VALUES (?,?,?,?,?)
    ON CONFLICT(product_id,offer_code,course_id) DO UPDATE SET access_days=excluded.access_days`)
    .run(newId('mapping'), productId, offerCode, courseId, accessDays);
  return true;
}

export async function removeMapping(id: string) {
  await getDb().prepare('DELETE FROM hotmart_products WHERE id=?').run(id);
}
