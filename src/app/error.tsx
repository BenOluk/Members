'use client';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <span className="text-destructive text-4xl font-heading" aria-hidden>△</span>
      <h1 className="text-2xl font-heading font-bold mt-6">Algo se rompeu no véu.</h1>
      <p className="text-foreground-muted mt-2 max-w-md">
        Um erro inesperado aconteceu. Tente novamente — se persistir, avise o Grão-Mestre.
      </p>
      <button
        onClick={reset}
        className="mt-8 bg-primary hover:bg-primary-hover text-background font-bold py-2.5 px-7 rounded-sm transition-colors text-sm"
      >
        Tentar de novo
      </button>
    </div>
  );
}
