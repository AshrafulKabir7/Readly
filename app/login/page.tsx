'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';

import { Brand } from '@/components/brand';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@lumendoc.ai');
  const [password, setPassword] = useState('lumendoc');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function enterWorkspace(mode: 'account' | 'guest') {
    sessionStorage.setItem('lumendoc-demo-session', mode);
    if (mode === 'account') {
      sessionStorage.setItem('lumendoc-demo-email', email);
    }
    router.push('/app');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.includes('@') || password.length < 6) {
      setError('Enter a valid email and at least 6 characters for the demo password.');
      return;
    }
    setError('');
    enterWorkspace('account');
  }

  return (
    <main className="min-h-screen bg-[#f6f7f8] text-[#111]">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-[#111] p-10 text-white lg:flex lg:flex-col xl:p-14">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:86px_86px] [mask-image:linear-gradient(135deg,black,transparent_90%)]" />
          <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-2.5 text-white">
            <span className="grid size-8 place-items-center rounded-[10px] bg-[#36aef5] text-white">
              <ScanLine className="size-4.5" />
            </span>
            <span className="text-[15px] font-bold tracking-[-0.025em]">LumenDoc AI</span>
          </Link>

          <div className="relative z-10 my-auto max-w-[520px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[11px] font-bold text-white/70">
              <ShieldCheck className="size-3.5 text-[#5ac5ff]" />
              Secure demo workspace
            </span>
            <h1 className="mt-7 font-heading text-[52px] font-semibold leading-[0.98] tracking-[-0.06em] xl:text-[64px]">
              Documents in.
              <br />
              Clean data out.
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-7 text-white/55">
              Experience the complete invoice extraction workflow—from upload and OCR to review and structured export.
            </p>
            <div className="mt-10 space-y-4">
              {[
                'PDF, PNG and JPG invoice processing',
                'Editable fields and line-item detection',
                'JSON, CSV and Excel export',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-white/70">
                  <span className="grid size-6 place-items-center rounded-full bg-[#36aef5]/15 text-[#5bc5ff]">
                    <Check className="size-3.5" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-[11px] text-white/35">Private browser processing · No document retention</p>
        </section>

        <section className="flex min-h-screen flex-col bg-white">
          <div className="flex h-[68px] items-center justify-between border-b border-black/[0.07] px-5 sm:px-8 lg:justify-end">
            <Link href="/" className="lg:hidden"><Brand /></Link>
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[#666] transition hover:text-black">
              <ArrowLeft className="size-3.5" /> Back to home
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
            <div className="w-full max-w-[420px]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#168ccd]">Welcome to LumenDoc</p>
              <h2 className="mt-3 font-heading text-[36px] font-semibold tracking-[-0.05em]">Enter the workspace.</h2>
              <p className="mt-3 text-sm leading-6 text-[#747474]">Use the prefilled portfolio credentials or continue directly as a guest.</p>

              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-[#333]">Email address</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm outline-none transition placeholder:text-[#aaa] focus:border-[#36aef5] focus:bg-white focus:ring-4 focus:ring-[#36aef5]/10"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-[#333]">Password</span>
                  <span className="relative block">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      className="h-12 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 pr-12 text-sm outline-none transition focus:border-[#36aef5] focus:bg-white focus:ring-4 focus:ring-[#36aef5]/10"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-[#888] transition hover:bg-black/[0.05] hover:text-black"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </span>
                </label>

                {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

                <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111] text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.13)] transition hover:-translate-y-0.5 hover:bg-[#242424]">
                  Sign in to demo <ArrowRight className="size-4" />
                </button>
              </form>

              <div className="my-6 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.15em] text-[#aaa]">
                <span className="h-px flex-1 bg-black/[0.08]" /> or <span className="h-px flex-1 bg-black/[0.08]" />
              </div>

              <button onClick={() => enterWorkspace('guest')} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white text-sm font-semibold text-[#333] transition hover:border-black/20 hover:bg-[#fafafa]">
                Continue as guest <ArrowRight className="size-4" />
              </button>

              <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-[#f1f9fe] p-3.5 text-[11px] leading-5 text-[#4a6c7e]">
                <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-[#168ccd]" />
                <p>This is a portfolio demo. The password is never transmitted or stored, and your uploaded documents remain in your browser.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
