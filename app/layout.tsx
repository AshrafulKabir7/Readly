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
  metadataBase: new URL(
    'https://lumendoc-invoice-ocr.md-ashraful-kabir-al.chatgpt.site',
  ),
  title: 'LumenDoc — Invoice data extraction',
  description:
    'Extract invoice fields and line items, review every value, and export structured JSON, CSV, or Excel data.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'LumenDoc — Invoice data extraction',
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
    title: 'LumenDoc — Invoice data extraction',
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
