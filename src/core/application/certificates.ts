import type { Certificate } from '../domain/entities';
import { mockCertificates } from '../infra/mockData';

export function listCertificates(userId: string): Certificate[] {
  return mockCertificates
    .filter((c) => c.userId === userId)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export function getCertificate(credentialCode: string): Certificate | undefined {
  return mockCertificates.find((c) => c.credentialCode === credentialCode);
}
