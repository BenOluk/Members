import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <span className="text-primary text-4xl font-heading" aria-hidden>△</span>
      <h1 className="text-2xl font-heading font-bold mt-6">Este caminho não existe.</h1>
      <p className="text-foreground-muted mt-2 max-w-md">
        O que você procura foi movido, removido — ou nunca esteve aqui.
      </p>
      <Link
        href="/"
        className="mt-8 bg-primary hover:bg-primary-hover text-background font-bold py-2.5 px-7 rounded-sm transition-colors text-sm"
      >
        Voltar ao Sanctum
      </Link>
    </div>
  );
}
