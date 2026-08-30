import Link from 'next/link';
import {
  ArrowRight,
  Check,
  FileJson2,
  FileSpreadsheet,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';

import { Brand } from '@/components/brand';
import { HeroVisual } from '@/components/hero-visual';

const capabilities = [
  {
    number: '01',
    title: 'Extract',
    copy: 'Vendor, invoice number, dates, totals and line items are detected from PDFs and images.',
  },
  {
    number: '02',
    title: 'Review',
    copy: 'The source document and extracted fields stay side by side, so every value can be checked and corrected.',
  },
  {
    number: '03',
    title: 'Export',
    copy: 'Approved data leaves the workspace as JSON, CSV or Excel—ready for the next system in your process.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f8f6] text-[#121212]">
      <header className="sticky top-0 z-40 border-b border-black/[0.09] bg-[#f8f8f6]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <Link href="/" aria-label="LumenDoc home">
            <Brand />
          </Link>

          <nav className="hidden items-center gap-8 text-[12px] font-medium text-[#555] md:flex">
            <a href="#product" className="transition hover:text-black">Product</a>
            <a href="#workflow" className="transition hover:text-black">Workflow</a>
            <a href="#privacy" className="transition hover:text-black">Privacy</a>
          </nav>

          <div className="flex items-center gap-1">
            <Link href="/login" className="hidden px-4 py-2 text-xs font-medium text-[#444] transition hover:text-black sm:inline-flex">
              Sign in
            </Link>
            <Link href="/login" className="inline-flex h-9 items-center gap-2 rounded-[9px] bg-[#151515] px-4 text-xs font-medium text-white transition hover:bg-black">
              Open workspace <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-black/[0.09]">
        <div className="mx-auto grid min-h-[720px] max-w-[1240px] items-center gap-12 px-5 py-16 lg:grid-cols-[0.83fr_1.17fr] lg:px-8 lg:py-20">
          <div className="relative z-10 max-w-[560px]">
            <div className="mb-7 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5e5e5e]">
              <span className="h-px w-7 bg-[#1ba5ef]" />
              Invoice extraction software
            </div>
            <h1 className="font-heading text-[48px] font-medium leading-[0.98] tracking-[-0.06em] sm:text-[64px] lg:text-[72px]">
              Invoice data,
              <br />
              ready for your systems.
            </h1>
            <p className="mt-7 max-w-[520px] text-[16px] leading-7 text-[#606060]">
              Upload an invoice. LumenDoc extracts the fields and line items, keeps every value editable, and exports a clean structured file.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#151515] px-5 text-sm font-medium text-white transition hover:bg-black">
                Try the workspace <ArrowRight className="size-4" />
              </Link>
              <a href="#workflow" className="inline-flex h-11 items-center justify-center rounded-[10px] border border-black/[0.14] px-5 text-sm font-medium text-[#333] transition hover:border-black/30 hover:bg-white">
                View the workflow
              </a>
            </div>
            <p className="mt-5 text-[11px] leading-5 text-[#7c7c7c]">
              No templates to configure. Demo documents remain in your browser.
            </p>
          </div>

          <HeroVisual />
        </div>
      </section>

      <section className="border-b border-black/[0.09] bg-white">
        <div className="mx-auto grid max-w-[1240px] divide-y divide-black/[0.08] px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-8">
          <FormatItem icon={ScanLine} label="Input" value="PDF, PNG, JPG" />
          <FormatItem icon={FileJson2} label="Structured output" value="JSON and CSV" />
          <FormatItem icon={FileSpreadsheet} label="Spreadsheet output" value="Excel workbook" />
        </div>
      </section>

      <section id="product" className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#777]">Product</p>
            <h2 className="mt-4 max-w-sm font-heading text-3xl font-medium leading-[1.08] tracking-[-0.045em] sm:text-[44px]">
              Built around the review step.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#686868]">
              OCR is useful only when the result can be inspected. LumenDoc keeps the document, detected values and output controls in one workspace.
            </p>
          </div>

          <div className="border-t border-black/[0.12]">
            {capabilities.map((item) => (
              <article key={item.number} className="grid gap-4 border-b border-black/[0.12] py-7 sm:grid-cols-[52px_150px_1fr] sm:items-start">
                <span className="font-mono text-[10px] text-[#909090]">{item.number}</span>
                <h3 className="font-heading text-lg font-medium tracking-[-0.025em]">{item.title}</h3>
                <p className="max-w-lg text-sm leading-6 text-[#686868]">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-[#121212] text-white">
        <div className="mx-auto max-w-[1240px] px-5 py-24 lg:px-8 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Workflow</p>
              <h2 className="mt-4 max-w-md font-heading text-3xl font-medium leading-[1.06] tracking-[-0.05em] sm:text-[46px]">
                Review first. Automate second.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/52">
                The extraction result is never hidden behind a score. Compare it with the source, adjust what matters, then choose the output your process needs.
              </p>
              <Link href="/login" className="mt-8 inline-flex items-center gap-2 border-b border-white/35 pb-1 text-sm font-medium text-white transition hover:border-white">
                Open the sample workspace <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="border border-white/[0.13] bg-[#181818]">
              <div className="flex items-center justify-between border-b border-white/[0.1] px-5 py-4">
                <span className="text-xs font-medium">Extraction record</span>
                <span className="font-mono text-[10px] text-white/38">INV-2408-036</span>
              </div>
              <div className="grid sm:grid-cols-2">
                <div className="border-b border-white/[0.1] p-5 sm:border-b-0 sm:border-r">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">Detected fields</p>
                  <div className="mt-6 space-y-5">
                    <RecordField label="Vendor" value="Northstar Office Supply" />
                    <RecordField label="Invoice date" value="August 14, 2026" />
                    <RecordField label="Total" value="$4,860.00" />
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/35">Ready checks</p>
                  <div className="mt-6 space-y-4">
                    {['Header fields reviewed', 'Three line items detected', 'Output format selected'].map((item) => (
                      <div key={item} className="flex items-center gap-3 text-xs text-white/64">
                        <span className="grid size-5 place-items-center border border-[#2eb5ff]/40 text-[#4bc0ff]"><Check className="size-3" /></span>
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex gap-2">
                    {['JSON', 'CSV', 'XLSX'].map((format, index) => (
                      <span key={format} className={`border px-2.5 py-1.5 font-mono text-[9px] ${index === 2 ? 'border-[#2eb5ff] bg-[#2eb5ff] text-black' : 'border-white/15 text-white/45'}`}>{format}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="privacy" className="border-b border-black/[0.09] bg-white">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-24 lg:grid-cols-2 lg:gap-24 lg:px-8 lg:py-28">
          <div>
            <ShieldCheck className="size-6 text-[#159fe9]" strokeWidth={1.7} />
            <h2 className="mt-6 font-heading text-3xl font-medium tracking-[-0.045em] sm:text-[42px]">Files stay with you.</h2>
          </div>
          <div className="max-w-xl">
            <p className="text-[16px] leading-7 text-[#555]">
              This portfolio demo performs OCR in the browser. It does not upload or retain the document you select.
            </p>
            <div className="mt-8 grid gap-5 border-t border-black/[0.1] pt-6 sm:grid-cols-2">
              <div><p className="text-xs font-medium">Transparent limitations</p><p className="mt-2 text-xs leading-5 text-[#777]">First PDF page, English OCR model, 10 MB file limit.</p></div>
              <div><p className="text-xs font-medium">Editable by default</p><p className="mt-2 text-xs leading-5 text-[#777]">Every detected value can be reviewed before export.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f8f6]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-7 px-5 py-20 sm:flex-row sm:items-end sm:justify-between lg:px-8 lg:py-24">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#777]">Try the product</p>
            <h2 className="mt-4 max-w-xl font-heading text-3xl font-medium leading-[1.08] tracking-[-0.045em] sm:text-[42px]">Use the sample invoice or bring your own.</h2>
          </div>
          <Link href="/login" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#151515] px-5 text-sm font-medium text-white transition hover:bg-black">
            Enter workspace <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/[0.09] bg-[#f8f8f6]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 py-7 text-xs text-[#777] sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Brand compact />
          <p>Invoice OCR demonstration · Documents processed locally</p>
        </div>
      </footer>
    </main>
  );
}

function FormatItem({ icon: Icon, label, value }: { icon: typeof ScanLine; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 py-6 sm:px-6 sm:first:pl-0">
      <Icon className="size-4 text-[#159fe9]" strokeWidth={1.8} />
      <div><p className="text-[10px] uppercase tracking-[0.13em] text-[#8a8a8a]">{label}</p><p className="mt-1 text-xs font-medium text-[#333]">{value}</p></div>
    </div>
  );
}

function RecordField({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[9px] uppercase tracking-[0.14em] text-white/30">{label}</p><p className="mt-1.5 text-sm text-white/76">{value}</p></div>;
}
