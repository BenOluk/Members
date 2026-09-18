import { validEmail } from './validation';

export interface HotmartEvent {
  id: string;
  event: string;
  createdAt: number;
  productId: string;
  offerCode: string;
  transactionId: string | null;
  email: string;
  name: string;
  subscriberCode: string | null;
  approvedAt: string | null;
  paidUntil: string | null;
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function identifier(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).slice(0, 200) : '';
}
function date(value: unknown): string | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value < 8640000000000000 ? new Date(value).toISOString() : null;
}

export const HOTMART_EVENTS = ['PURCHASE_APPROVED', 'PURCHASE_COMPLETE', 'PURCHASE_REFUNDED', 'PURCHASE_CHARGEBACK', 'PURCHASE_CANCELED', 'PURCHASE_EXPIRED', 'PURCHASE_DELAYED', 'PURCHASE_PROTEST', 'SUBSCRIPTION_CANCELLATION'] as const;

/** Contrato oficial Hotmart Webhook 2.0.0; campos não utilizados não são persistidos. */
export function parseHotmartEvent(value: unknown): HotmartEvent | null {
  const raw = record(value);
  const data = record(raw.data);
  const purchase = record(data.purchase);
  const subscription = record(data.subscription);
  const cancellation = raw.event === 'SUBSCRIPTION_CANCELLATION';
  const buyer = record(cancellation ? data.subscriber : data.buyer);
  const subscriber = record(subscription.subscriber);
  const id = identifier(raw.id);
  const event = identifier(raw.event);
  const productId = identifier(record(data.product).id);
  const transactionId = identifier(purchase.transaction) || null;
  const subscriberCode = identifier(cancellation ? buyer.code : subscriber.code) || null;
  if (raw.version !== '2.0.0' || !id || !event || !productId || !date(raw.creation_date)) return null;
  if (HOTMART_EVENTS.includes(event as typeof HOTMART_EVENTS[number]) && (cancellation ? !subscriberCode : !transactionId)) return null;
  const email = typeof buyer.email === 'string' ? buyer.email.trim().toLowerCase() : '';
  if (['PURCHASE_APPROVED', 'PURCHASE_COMPLETE'].includes(event) && !validEmail(email)) return null;
  return {
    id, event, productId, transactionId, subscriberCode, email,
    createdAt: raw.creation_date as number,
    name: typeof buyer.name === 'string' ? buyer.name.trim().slice(0, 100) : 'Membro',
    offerCode: identifier(record(purchase.offer).code),
    approvedAt: date(purchase.approved_date),
    paidUntil: date(cancellation ? data.date_next_charge : purchase.date_next_charge),
  };
}
