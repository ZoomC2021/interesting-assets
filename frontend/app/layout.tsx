import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'REIT Monitor - Malaysian REIT Dashboard',
  description: 'Comprehensive monitoring and comparison tool for Malaysian Real Estate Investment Trusts with 970+ verified references, 30+ metrics, and 10 REITs tracked.',
  keywords: ['REIT', 'Malaysia', 'Real Estate', 'Investment', 'Bursa Malaysia', 'Atrium', 'Axis', 'Sunway', 'Pavilion'],
  authors: [{ name: 'REIT Monitor' }],
  openGraph: {
    title: 'REIT Monitor - Malaysian REIT Dashboard',
    description: 'Comprehensive monitoring and comparison tool for Malaysian Real Estate Investment Trusts',
    type: 'website',
    locale: 'en_MY',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'REIT Monitor - Malaysian REIT Dashboard',
    description: 'Comprehensive monitoring and comparison tool for Malaysian Real Estate Investment Trusts',
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
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-canvas text-ink">
        {/* Skip to main content link for accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <main id="main-content" className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
