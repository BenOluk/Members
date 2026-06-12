import { AppHeader } from '@/components/AppHeader';
import { CertificateCard } from '@/components/CertificateCard';
import { requireUser } from '@/core/application/session';
import { listCertificates } from '@/core/application/certificates';

export default async function CertificatesPage() {
  const user = await requireUser();
  const certs = listCertificates(user.id);

  return (
    <div className="min-h-screen">
      <AppHeader user={user} />
      <main className="max-w-4xl mx-auto px-6 py-10 pb-20">
        <header className="mb-10">
          <h1 className="text-4xl font-heading font-bold">Certificados</h1>
          <p className="text-foreground-muted mt-2">Trilhas concluídas. Cada certificado tem código único verificável.</p>
        </header>

        {certs.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-10 text-center">
            <p className="text-lg">Você ainda não emitiu nenhum certificado.</p>
            <p className="text-foreground-muted text-sm mt-2">Conclua uma trilha completa para desbloquear.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {certs.map((c) => <CertificateCard key={c.id} certificate={c} />)}
          </div>
        )}
      </main>
    </div>
  );
}
