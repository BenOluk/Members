import { randomBytes } from 'node:crypto';
import type { Certificate } from '@/core/domain/entities';
import { getDb, newId } from '../db';

interface CertificateRow {
  id: string;
  user_id: string;
  course_id: string;
  issued_at: string;
  credential_code: string;
}

function toCertificate(row: CertificateRow): Certificate {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    issuedAt: row.issued_at,
    credentialCode: row.credential_code,
  };
}

export function listForUser(userId: string): Certificate[] {
  const rows = getDb()
    .prepare('SELECT * FROM certificates WHERE user_id = ? ORDER BY issued_at DESC')
    .all(userId) as unknown as CertificateRow[];
  return rows.map(toCertificate);
}

export function getByCode(credentialCode: string): Certificate | undefined {
  const row = getDb()
    .prepare('SELECT * FROM certificates WHERE credential_code = ?')
    .get(credentialCode) as CertificateRow | undefined;
  return row ? toCertificate(row) : undefined;
}

export function exists(userId: string, courseId: string): boolean {
  return Boolean(getDb().prepare('SELECT 1 FROM certificates WHERE user_id = ? AND course_id = ?').get(userId, courseId));
}

/** Emite certificado se ainda não existir; devolve o registro. */
export function issue(userId: string, courseId: string): Certificate {
  const existing = getDb()
    .prepare('SELECT * FROM certificates WHERE user_id = ? AND course_id = ?')
    .get(userId, courseId) as CertificateRow | undefined;
  if (existing) return toCertificate(existing);

  const code = `PHM-${new Date().getFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`;
  const id = newId('cert');
  getDb()
    .prepare('INSERT INTO certificates (id, user_id, course_id, issued_at, credential_code) VALUES (?,?,?,?,?)')
    .run(id, userId, courseId, new Date().toISOString(), code);
  return getByCode(code)!;
}
