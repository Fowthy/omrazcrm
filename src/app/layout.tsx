import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

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
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
