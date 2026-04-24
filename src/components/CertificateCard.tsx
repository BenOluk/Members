import type { Certificate } from '@/core/domain/entities';
import { getCourseById } from '@/core/application/courses';
import { getUserById } from '@/core/application/users';

interface CertificateCardProps {
  certificate: Certificate;
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  const course = getCourseById(certificate.courseId);
  const user = getUserById(certificate.userId);
  const issued = new Date(certificate.issuedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="relative p-8 rounded-lg border border-primary/40 bg-gradient-to-br from-surface via-background to-surface overflow-hidden">
      <div aria-hidden className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative">
        <p className="text-xs uppercase tracking-widest text-primary font-bold">Certificado de Conclusão</p>
        <p className="mt-2 text-foreground-muted">Este certificado confere a</p>
        <h2 className="text-3xl font-heading font-bold mt-1">{user?.name ?? '—'}</h2>
        <p className="mt-4 text-foreground-muted">a conclusão da trilha</p>
        <h3 className="text-xl font-heading font-semibold text-primary mt-1">{course?.title ?? '—'}</h3>

        <div className="mt-8 pt-4 border-t border-border flex justify-between items-end">
          <div>
            <p className="text-xs uppercase tracking-wider text-foreground-muted">Emitido em</p>
            <p className="text-sm font-medium mt-0.5">{issued}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-foreground-muted">Credencial</p>
            <p className="text-sm font-mono text-primary mt-0.5">{certificate.credentialCode}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
