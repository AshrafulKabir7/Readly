import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  Clock3,
  FileCheck2,
  FileJson2,
  FileSpreadsheet,
  FileText,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
  WandSparkles,
} from 'lucide-react';

import { Brand } from '@/components/brand';

const features = [
  {
    icon: ScanLine,
    title: 'OCR + smart parsing',
    copy: 'Read vendor details, invoice numbers, dates, totals and line items from common invoice layouts.',
    accent: '98.7% average confidence',
  },
  {
    icon: WandSparkles,
    title: 'Editable structured data',
    copy: 'Review every detected field in a clean workspace and correct a value before it reaches your workflow.',
    accent: 'Human-in-the-loop review',
  },
  {
    icon: FileSpreadsheet,
    title: 'Workflow-ready exports',
    copy: 'Download clean JSON, CSV or Excel files for accounting, automation and reporting systems.',
    accent: 'Three export formats',
  },
  {
    icon: LockKeyhole,
    title: 'Private by design',
    copy: 'The public demo processes documents inside your browser. Files are not uploaded or retained.',
    accent: 'Local document processing',
  },
];

const useCases = [
  {
    icon: FileCheck2,
    title: 'Finance teams',
    copy: 'Turn supplier invoices into review-ready records without manual retyping.',
  },
  {
    icon: Users,
    title: 'Operations teams',
    copy: 'Standardize documents from multiple vendors before they enter internal systems.',
  },
  {
    icon: BarChart3,
    title: 'Automation builders',
    copy: 'Create structured inputs for APIs, RPA workflows and reporting pipelines.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#111111]">
      <header className="sticky top-0 z-40 border-b border-black/[0.07] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-5 lg:px-8">
          <Link href="/" aria-label="LumenDoc home">
            <Brand />
          </Link>

          <nav className="hidden items-center gap-8 text-[12px] font-semibold text-[#4b4b4b] md:flex">
            <a href="#features" className="transition hover:text-black">Features</a>
            <a href="#how-it-works" className="transition hover:text-black">How it works</a>
            <a href="#use-cases" className="transition hover:text-black">Use cases</a>
            <a href="#security" className="transition hover:text-black">Security</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-xs font-semibold text-[#242424] transition hover:bg-[#f4f4f4] sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#111111] px-4 text-xs font-semibold text-white shadow-[0_8px_22px_rgba(0,0,0,0.15)] transition hover:-translate-y-0.5 hover:bg-[#242424]"
            >
              Try the demo <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative border-b border-black/[0.07] bg-[#fbfbfb]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(17,17,17,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,17,17,0.045)_1px,transparent_1px)] bg-[size:96px_96px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]" />
        <div className="relative mx-auto max-w-[1180px] px-5 pb-0 pt-20 text-center sm:pt-24 lg:px-8 lg:pt-28">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-[#36aef5]/20 bg-[#eaf7ff] px-3 py-1.5 text-[11px] font-bold text-[#087abb]">
            <Sparkles className="size-3.5" />
            Private invoice intelligence
          </div>
          <h1 className="mx-auto max-w-[780px] font-heading text-[42px] font-semibold leading-[0.98] tracking-[-0.06em] sm:text-[58px] lg:text-[72px]">
            Upload invoices.
            <br />
            Get clean data instantly.
          </h1>
          <p className="mx-auto mt-6 max-w-[610px] text-[15px] leading-6 text-[#686868] sm:text-base">
            LumenDoc transforms PDFs and images into structured, editable invoice data—ready for accounting, reporting and automation.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#111111] px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.15)] transition hover:-translate-y-0.5"
            >
              Start extracting <ArrowRight className="size-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-black/10 bg-white px-6 text-sm font-semibold text-[#242424] transition hover:border-black/20 hover:bg-[#f7f7f7]"
            >
              See how it works
            </a>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1180px] px-5 py-20 lg:px-8 lg:py-28">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#168ccd]">Built for real workflows</p>
          <h2 className="font-heading text-3xl font-semibold tracking-[-0.045em] sm:text-[42px] sm:leading-[1.05]">
            Powerful invoice intelligence for every team.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#6d6d6d]">
            From OCR to editable exports, every step is designed to remove repetitive document work without hiding the result from you.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className={`group relative min-h-[270px] overflow-hidden rounded-[22px] border border-black/[0.08] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(12,37,53,0.08)] sm:p-8 ${index === 0 ? 'bg-[#f4fbff]' : 'bg-[#fcfcfc]'}`}
            >
              <div className="flex items-start justify-between">
                <span className="grid size-10 place-items-center rounded-xl border border-[#36aef5]/20 bg-white text-[#1597df] shadow-sm">
                  <feature.icon className="size-5" />
                </span>
                <span className="rounded-full border border-black/[0.07] bg-white px-3 py-1 text-[10px] font-bold text-[#5f5f5f]">
                  {feature.accent}
                </span>
              </div>
              <div className="mt-16 max-w-md">
                <h3 className="font-heading text-xl font-semibold tracking-[-0.035em]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#717171]">{feature.copy}</p>
              </div>
              <div className="absolute -bottom-12 -right-8 size-36 rounded-full bg-[#36aef5]/[0.07] blur-2xl transition group-hover:bg-[#36aef5]/[0.12]" />
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-black/[0.07] bg-[#f8f8f8]">
        <div className="mx-auto max-w-[1180px] px-5 py-20 lg:px-8 lg:py-24">
          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#168ccd]">Three simple steps</p>
              <h2 className="font-heading text-3xl font-semibold tracking-[-0.045em] sm:text-[42px]">From invoice to export.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#6d6d6d]">No setup, templates or complicated configuration. Upload a document and review the result.</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-[22px] border border-black/[0.08] bg-black/[0.08] md:grid-cols-3">
            {[
              ['01', UploadCloud, 'Upload', 'Choose a PDF, PNG or JPG invoice up to 10 MB.'],
              ['02', ScanLine, 'Extract', 'OCR reads the document and structures key invoice fields.'],
              ['03', FileJson2, 'Review & export', 'Correct any value and download JSON, CSV or Excel.'],
            ].map(([step, Icon, title, copy]) => {
              const StepIcon = Icon as typeof UploadCloud;
              return (
                <article key={String(step)} className="bg-white p-7 sm:p-8">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-[#a0a0a0]">{String(step)}</span>
                    <StepIcon className="size-5 text-[#1c9fe8]" />
                  </div>
                  <h3 className="mt-14 font-heading text-lg font-semibold tracking-[-0.03em]">{String(title)}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#707070]">{String(copy)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="use-cases" className="mx-auto max-w-[1180px] px-5 py-20 lg:px-8 lg:py-28">
        <div className="text-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#168ccd]">Made to fit your work</p>
          <h2 className="font-heading text-3xl font-semibold tracking-[-0.045em] sm:text-[42px]">Useful wherever invoices move.</h2>
        </div>
        <div className="mt-11 grid gap-4 md:grid-cols-3">
          {useCases.map((item) => (
            <article key={item.title} className="rounded-[20px] border border-black/[0.08] bg-white p-6 shadow-[0_12px_35px_rgba(0,0,0,0.035)]">
              <item.icon className="size-5 text-[#1597df]" />
              <h3 className="mt-10 font-heading text-lg font-semibold tracking-[-0.03em]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#747474]">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="security" className="mx-auto max-w-[1180px] px-5 pb-20 lg:px-8 lg:pb-28">
        <div className="grid overflow-hidden rounded-[28px] bg-[#111111] text-white lg:grid-cols-[1fr_0.86fr]">
          <div className="p-8 sm:p-12 lg:p-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/80">
              <ShieldCheck className="size-3.5 text-[#59c5ff]" /> Privacy first
            </span>
            <h2 className="mt-7 max-w-xl font-heading text-3xl font-semibold tracking-[-0.05em] sm:text-[44px] sm:leading-[1.05]">
              Your documents stay under your control.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">
              This demonstration processes documents locally in your browser. Nothing is retained after you leave the page.
            </p>
          </div>
          <div className="border-t border-white/10 bg-[#171717] p-8 sm:p-12 lg:border-l lg:border-t-0">
            <div className="space-y-5">
              {[
                'No document storage',
                'Editable results before export',
                'Clear OCR confidence indicators',
                'PDF, PNG and JPG support',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-white/75">
                  <span className="grid size-6 place-items-center rounded-full bg-[#36aef5]/15 text-[#66c9ff]">
                    <Check className="size-3.5" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-black/[0.07] bg-[#f4faff]">
        <div className="mx-auto max-w-[900px] px-5 py-20 text-center lg:py-24">
          <BadgeCheck className="mx-auto size-8 text-[#20a5ee]" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-[-0.05em] sm:text-[46px]">Ready to stop typing invoices by hand?</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#6d6d6d]">Try the complete extraction workflow using the included sample or one of your own documents.</p>
          <Link href="/login" className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-[#111111] px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5">
            Enter the workspace <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/[0.07] bg-white">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-5 py-7 text-xs text-[#777] sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Brand compact />
          <p>Invoice OCR demonstration · Documents processed locally</p>
        </div>
      </footer>
    </main>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto mt-14 max-w-[930px] pb-0 sm:mt-16">
      <div className="absolute -inset-x-8 bottom-0 top-24 rounded-t-[36px] bg-[#42b6f7] opacity-95 sm:-inset-x-14" />
      <div className="relative mx-auto overflow-hidden rounded-t-[24px] border border-black/[0.1] border-b-0 bg-white text-left shadow-[0_30px_90px_rgba(25,95,134,0.2)]">
        <div className="flex h-11 items-center gap-2 border-b border-black/[0.07] bg-[#fcfcfc] px-4">
          <span className="size-2.5 rounded-full bg-[#ff6b6b]" />
          <span className="size-2.5 rounded-full bg-[#ffd35a]" />
          <span className="size-2.5 rounded-full bg-[#5bd48a]" />
          <span className="ml-3 text-[10px] font-semibold text-[#8a8a8a]">LumenDoc extraction workspace</span>
          <span className="ml-auto hidden items-center gap-1.5 text-[9px] font-bold text-[#278dc7] sm:flex"><LockKeyhole className="size-3" /> Private processing</span>
        </div>
        <div className="grid min-h-[330px] gap-px bg-black/[0.07] md:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-[#f1f4f6] p-5 sm:p-7">
            <div className="mx-auto max-w-[280px] rounded-xl bg-white p-5 shadow-[0_12px_35px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between border-b border-black/[0.08] pb-4">
                <div className="space-y-1.5"><div className="h-2 w-20 rounded bg-[#111]" /><div className="h-1.5 w-12 rounded bg-[#b9b9b9]" /></div>
                <FileText className="size-7 text-[#36aef5]" />
              </div>
              <div className="mt-5 space-y-3">
                {[82, 100, 68, 92].map((width, index) => <div key={index} className="h-2 rounded bg-[#e8e8e8]" style={{ width: `${width}%` }} />)}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2 rounded-lg bg-[#f5f5f5] p-3">
                <div className="col-span-2 h-2 rounded bg-[#d9d9d9]" /><div className="h-2 rounded bg-[#bfe9ff]" />
                <div className="col-span-2 h-2 rounded bg-[#d9d9d9]" /><div className="h-2 rounded bg-[#bfe9ff]" />
                <div className="col-span-2 h-2 rounded bg-[#d9d9d9]" /><div className="h-2 rounded bg-[#bfe9ff]" />
              </div>
            </div>
          </div>
          <div className="bg-white p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-bold">Extraction complete</p><p className="mt-1 text-[10px] text-[#888]">8 fields detected in 2.1 seconds</p></div>
              <span className="rounded-full bg-[#eaf8ff] px-2.5 py-1 text-[9px] font-bold text-[#168ccd]">98.7% confidence</span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {['Vendor', 'Invoice number', 'Invoice date', 'Total due'].map((label, index) => (
                <div key={label} className="rounded-xl border border-black/[0.08] p-3">
                  <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#999]">{label}</p>
                  <div className={`mt-2 h-2 rounded ${index === 3 ? 'w-16 bg-[#36aef5]' : 'w-24 bg-[#292929]'}`} />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#111] p-4 text-white">
              <div><p className="text-[8px] font-bold uppercase tracking-[0.12em] text-white/45">Total due</p><p className="mt-1 text-lg font-semibold">$4,860.00</p></div>
              <div className="flex gap-2"><span className="rounded-md bg-white/10 px-2 py-1 text-[8px]">CSV</span><span className="rounded-md bg-[#36aef5] px-2 py-1 text-[8px] font-bold">Export</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative mx-auto flex max-w-[760px] items-center justify-center gap-5 bg-[#42b6f7] py-5 text-[10px] font-bold uppercase tracking-[0.13em] text-white/85">
        <span className="flex items-center gap-1.5"><Clock3 className="size-3.5" /> Fast</span>
        <span className="size-1 rounded-full bg-white/45" />
        <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> Private</span>
        <span className="size-1 rounded-full bg-white/45" />
        <span className="flex items-center gap-1.5"><FileSpreadsheet className="size-3.5" /> Exportable</span>
      </div>
    </div>
  );
}
