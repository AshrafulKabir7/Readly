import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invoice extraction workspace | LumenDoc',
  description: 'Upload, review and export structured invoice data with LumenDoc OCR.',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
