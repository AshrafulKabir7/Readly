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

export const metadata: Metadata = {
  metadataBase: new URL('https://lumendoc-invoice-ocr.openai.site'),
  title: 'LumenDoc - Invoice OCR and Data Extraction',
  description:
    'Extract invoice fields and line items into clean, editable data with privacy-first OCR.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'LumenDoc - Invoice OCR and Data Extraction',
    description:
      'Turn invoices into editable structured data and export JSON, CSV, or Excel files.',
    images: [
      {
        url: '/og.png',
        width: 1536,
        height: 1024,
        alt: 'LumenDoc invoice OCR and data extraction',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LumenDoc - Invoice OCR and Data Extraction',
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
