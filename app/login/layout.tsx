import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in | LumenDoc Invoice OCR',
  description: 'Enter the LumenDoc invoice extraction demonstration workspace.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
