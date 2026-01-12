import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Omraz Studio - Band Management Platform',
  description: 'A comprehensive band management platform for Omraz. Manage projects, songs, rehearsals, finances, and more.',
  keywords: ['band management', 'music', 'studio', 'project management', 'Omraz'],
  authors: [{ name: 'Omraz' }],
  openGraph: {
    title: 'Omraz Studio',
    description: 'Band Management Platform',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
