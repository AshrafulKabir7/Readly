import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  // Absolute URLs for social previews: Vercel's production domain when deployed there.
  metadataBase: new URL(siteUrl),
  title: 'Readly — Invoice data extraction',
  description:
    'Extract invoice fields and line items, review every value, and export structured JSON, CSV, or Excel data.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Readly — Invoice data extraction',
    description:
      'Turn invoices into editable structured data and export JSON, CSV, or Excel files.',
    images: [
      {
        url: '/og.png',
        width: 1536,
        height: 1024,
        alt: 'Readly invoice OCR and data extraction',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Readly — Invoice data extraction',
    description:
      'Turn invoices into editable structured data and export JSON, CSV, or Excel files.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
