import type { Certificate } from '../domain/entities';
import * as certificatesRepo from '../infra/repos/certificates';

export function listCertificates(userId: string): Certificate[] {
  return certificatesRepo.listForUser(userId);
}

export function getCertificate(credentialCode: string): Certificate | undefined {
  return certificatesRepo.getByCode(credentialCode);
}
