import type { Metadata } from "next";
import "./globals.css";

// Área privada: nunca consultar/migrar banco durante pré-renderização do build.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: { default: 'Sanctum · O Polímata Hermético', template: '%s · Sanctum' },
  description: "Trilhas de estudo, encontros e comunidade do Polímata Hermético.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased dark"
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
