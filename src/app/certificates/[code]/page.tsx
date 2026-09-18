import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/core/application/session';
import { getCertificate } from '@/core/application/certificates';
import { CertificateCard } from '@/components/CertificateCard';
import { PrintButton } from '@/components/PrintButton';
export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const user = await requireUser();
  const certificate = await getCertificate((await params).code);
  if (!certificate || (certificate.userId !== user.id && user.role !== 'admin')) notFound();
  return <main className="max-w-4xl mx-auto px-6 py-16"><div className="flex justify-between items-center mb-8 print:hidden"><Link href="/certificates">← Certificados</Link><PrintButton /></div><CertificateCard certificate={certificate} /><p className="text-sm text-foreground-muted mt-6">Sanctum · O Polímata Hermético. Registro de conclusão das aulas, sem equivalência a diploma ou reconhecimento acadêmico.</p></main>;
}
