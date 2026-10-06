'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';

import { Brand } from '@/components/brand';

const steps = [
  ['01', 'Upload', 'Add one invoice or a whole batch: PDF, scan or photo.'],
  ['02', 'Review', 'Every value is outlined where it was found on the page.'],
  ['03', 'Export', 'JSON, CSV, Excel or a typed PDF.'],
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@readly.app');
  const [password, setPassword] = useState('readly-demo');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function enterWorkspace(mode: 'account' | 'guest') {
    sessionStorage.setItem('readly-demo-session', mode);
    if (mode === 'account') sessionStorage.setItem('readly-demo-email', email);
    router.push('/app');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.includes('@') || password.length < 6) {
      setError('Enter a valid email and at least six password characters.');
      return;
    }
    setError('');
    enterWorkspace('account');
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] text-[#151b2c]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(520px,0.85fr)_1.15fr]">
        <section className="flex min-h-screen flex-col border-r border-black/[0.1] px-5 sm:px-10 lg:px-14 xl:px-20">
          <header className="flex h-20 items-center justify-between">
            <Link href="/" aria-label="Readly home"><Brand /></Link>
            <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#666] transition hover:text-black">
              <ArrowLeft className="size-3.5" /> Home
            </Link>
          </header>

          <div className="my-auto w-full max-w-[410px] py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4b4fe0]">Portfolio demonstration</p>
            <h1 className="mt-4 font-heading text-[38px] font-medium tracking-[-0.05em]">Access Readly</h1>
            <p className="mt-3 text-sm leading-6 text-[#696969]">
              Use the prefilled demo account, or enter as a guest. Both paths open the same invoice workspace.
            </p>

            <form onSubmit={handleSubmit} className="mt-9">
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-[#3c3c3c]">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  className="h-12 w-full rounded-[9px] border border-black/[0.14] bg-white px-3.5 text-sm outline-none transition focus:border-[#5b5ef0] focus:ring-3 focus:ring-[#5b5ef0]/10"
                />
              </label>

              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-medium text-[#3c3c3c]">Password</span>
                <span className="relative block">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="h-12 w-full rounded-[9px] border border-black/[0.14] bg-white px-3.5 pr-12 text-sm outline-none transition focus:border-[#5b5ef0] focus:ring-3 focus:ring-[#5b5ef0]/10"
                  />
                  <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center text-[#777] transition hover:text-black">
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </span>
              </label>

              {error && <p role="alert" className="mt-3 border-l-2 border-red-500 pl-3 text-xs leading-5 text-red-700">{error}</p>}

              <button type="submit" className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[9px] bg-[#151b2c] text-sm font-medium text-white transition hover:bg-[#252d45]">
                Continue <ArrowRight className="size-4" />
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.12em] text-[#98a2b3]"><span className="h-px flex-1 bg-black/[0.1]" />or<span className="h-px flex-1 bg-black/[0.1]" /></div>

            <button type="button" onClick={() => enterWorkspace('guest')} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[9px] border border-black/[0.14] bg-transparent text-sm font-medium transition hover:border-black/30 hover:bg-white">
              Continue as guest <ArrowRight className="size-4" />
            </button>

            <div className="mt-7 flex items-start gap-3 border-t border-black/[0.1] pt-5 text-xs leading-5 text-[#667085]">
              <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-[#5b5ef0]" />
              <p>This screen demonstrates an access flow; it is not a production identity system. Passwords and documents are not transmitted.</p>
            </div>
          </div>

          <footer className="pb-8 text-xs text-[#98a2b3]">Readly · Invoice OCR demonstration</footer>
        </section>

        <aside className="relative hidden overflow-hidden bg-[#151b2c] text-white lg:flex lg:flex-col lg:justify-between lg:p-14 xl:p-20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(145deg,black,transparent_86%)]" />
          <div className="relative z-10">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/45">A three-step workflow</p>
            <h2 className="mt-5 max-w-xl font-heading text-[46px] font-medium leading-[1.04] tracking-[-0.055em] xl:text-[58px]">
              From document to structured record.
            </h2>
          </div>

          <div className="relative z-10 mt-16 border-t border-white/[0.14]">
            {steps.map(([number, title, copy]) => (
              <div key={number} className="grid grid-cols-[48px_120px_1fr] border-b border-white/[0.14] py-5">
                <span className="font-mono text-xs text-[#9fa1ff]">{number}</span>
                <span className="text-sm font-medium text-white/88">{title}</span>
                <span className="text-sm leading-6 text-white/55">{copy}</span>
              </div>
            ))}
          </div>

          <p className="relative z-10 mt-16 max-w-md text-sm leading-6 text-white/45">Three sample invoices (a digital PDF, a phone photo and a scanned receipt) are ready in the workspace. All sample data is fictional.</p>
        </aside>
      </div>
    </main>
  );
}
