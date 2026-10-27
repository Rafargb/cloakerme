import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'CLOAKERME — Plataforma de Cloaking & Criativos',
  description: 'Plataforma de alta performance para Cloaking de Campanhas, Camuflagem de Criativos em Vídeo e Proteção de Tráfego.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/logo-icon-transparent.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/brand/logo-icon-transparent.png',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
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
