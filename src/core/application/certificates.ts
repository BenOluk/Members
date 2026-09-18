import type { Certificate } from '../domain/entities';
import * as certificatesRepo from '../infra/repos/certificates';
export async function listCertificates(userId: string): Promise<Certificate[]> {
    return (await certificatesRepo.listForUser(userId));
}
export async function getCertificate(credentialCode: string): Promise<Certificate | undefined> {
    return (await certificatesRepo.getByCode(credentialCode));
}
