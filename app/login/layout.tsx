import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in | Readly Invoice OCR',
  description: 'Enter the Readly invoice extraction demonstration workspace.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
