import { randomBytes } from 'node:crypto';
import type { Certificate } from '@/core/domain/entities';
import { getDb, newId } from '../db';
interface CertificateRow {
    recipient_name: string;
    course_title: string;
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
        recipientName: row.recipient_name,
        courseTitle: row.course_title,
    };
}
export async function listForUser(userId: string): Promise<Certificate[]> {
    const rows = (await getDb()
        .prepare('SELECT * FROM certificates WHERE user_id = ? ORDER BY issued_at DESC')
        .all(userId)) as unknown as CertificateRow[];
    return rows.map(toCertificate);
}
export async function getByCode(credentialCode: string): Promise<Certificate | undefined> {
    const row = (await getDb()
        .prepare('SELECT * FROM certificates WHERE credential_code = ?')
        .get(credentialCode)) as CertificateRow | undefined;
    return row ? toCertificate(row) : undefined;
}
export async function exists(userId: string, courseId: string): Promise<boolean> {
    return Boolean((await getDb().prepare('SELECT 1 FROM certificates WHERE user_id = ? AND course_id = ?').get(userId, courseId)));
}
/** Emite certificado se ainda não existir; devolve o registro. */
export async function issue(userId: string, courseId: string): Promise<Certificate> {
    const existing = (await getDb()
        .prepare('SELECT * FROM certificates WHERE user_id = ? AND course_id = ?')
        .get(userId, courseId)) as CertificateRow | undefined;
    if (existing)
        return toCertificate(existing);
    const code = `PHM-${new Date().getFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`;
    const id = newId('cert');
    (await getDb()
        .prepare('INSERT INTO certificates (id, user_id, course_id, issued_at, credential_code, recipient_name, course_title) VALUES (?,?,?,?,?,(SELECT name FROM users WHERE id=?),(SELECT title FROM courses WHERE id=?))')
        .run(id, userId, courseId, new Date().toISOString(), code, userId, courseId));
    return (await getByCode(code))!;
}
