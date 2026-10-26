import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Cloakby — Plataforma de Cloaking & Criativos',
  description: 'Plataforma completa de Cloaking com motor FFmpeg de criativos, camuflagem de texto e cloaker em tempo real.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if ((e.filename && e.filename.indexOf('chrome-extension://') !== -1) || (e.message && e.message.indexOf('M_ID') !== -1)) {
                  e.stopImmediatePropagation();
                  e.preventDefault();
                  return true;
                }
              }, true);
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#080808] text-zinc-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
