import type { Metadata, Viewport } from 'next';
import { AppShell } from '@/components/reit-research/AppShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'REIT Research',
  description:
    'Research-led monitoring, memo writing, and comparison workspace for Malaysian REITs.',
  keywords: [
    'REIT',
    'Malaysia',
    'Real Estate',
    'Investment',
    'Bursa Malaysia',
    'Research',
  ],
  authors: [{ name: 'REIT Research' }],
  openGraph: {
    title: 'REIT Research',
    description:
      'Research-led monitoring and comparison workspace for Malaysian REITs.',
    type: 'website',
    locale: 'en_MY',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'REIT Research',
    description:
      'Research-led monitoring and comparison workspace for Malaysian REITs.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1b4f72',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-canvas text-ink antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
