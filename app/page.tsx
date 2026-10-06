import Link from 'next/link';
import {
  ArrowRight,
  Braces,
  CheckCircle2,
  Crosshair,
  FileSpreadsheet,
  FileText,
  Layers,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';

import { Brand } from '@/components/brand';
import { CleanCompare } from '@/components/clean-compare';
import { HeroVisual } from '@/components/hero-visual';

const steps = [
  {
    title: 'Read',
    copy: 'Digital PDFs are read straight from their text layer. Scans and phone photos go through OCR, with an automatic clean-up pass when the first reading is uncertain.',
    icon: ScanLine,
  },
  {
    title: 'Structure',
    copy: 'Vendor, invoice number, dates, currency, line items and totals are pulled into a typed record. Each value remembers the line it came from.',
    icon: Layers,
  },
  {
    title: 'Verify and export',
    copy: 'Hover a field to see its source on the page, fix anything flagged, approve, then export JSON, CSV, Excel or a typed PDF.',
    icon: CheckCircle2,
  },
];

const features = [
  {
    title: 'Source evidence for every field',
    copy: 'Focus a value and the exact line is outlined on the document, with its recognition confidence.',
    icon: Crosshair,
  },
  {
    title: 'Photo clean-up',
    copy: 'Levels tilted shots, flattens shadows and strips table borders that make OCR drop rows.',
    icon: Wand2,
  },
  {
    title: 'Four automatic checks',
    copy: 'Identity, dates, line items against the subtotal, and subtotal + tax against the total.',
    icon: ShieldCheck,
  },
  {
    title: 'Batch queue',
    copy: 'Drop a stack of invoices. They process one after another and export together as one CSV.',
    icon: FileSpreadsheet,
  },
  {
    title: 'Real-world formats',
    copy: 'UK and EU day-first dates, European number formats like 1.234,56, and seven currencies.',
    icon: Sparkles,
  },
  {
    title: 'Private by design',
    copy: 'Files are processed inside the browser tab. Nothing is uploaded, stored or logged.',
    icon: LockKeyhole,
  },
];

const faqs = [
  {
    q: 'Which documents work best?',
    a: 'Digital PDFs are exact because their text is read directly. Clear scans and well-lit phone photos work well. Very low-resolution images, heavy creases and handwriting are harder; the checks and confidence markers tell you what to review.',
  },
  {
    q: 'Is anything sent to a server?',
    a: 'No. The demo runs OCR and parsing in your browser. The OCR engine and its English language data (about 5 MB) download once from a public CDN; your documents never do.',
  },
  {
    q: 'How many pages does it read?',
    a: 'The first three pages of a PDF, which covers almost all invoices. A production build can lift the limit or split statements into separate records.',
  },
  {
    q: 'Can it be connected to my systems?',
    a: 'Yes. The record is plain JSON. A buyer build can post approved records to an accounting tool, a spreadsheet, a webhook or a database, and add sign-in for a team.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-white text-[#151b2c]">
      <header className="sticky top-0 z-40 border-b border-transparent bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 lg:px-8">
          <Link href="/" aria-label="Readly home">
            <Brand />
          </Link>
          <nav className="hidden items-center gap-1 text-sm text-[#475467] md:flex">
            {[
              ['#how', 'How it works'],
              ['#cleanup', 'Photo clean-up'],
              ['#features', 'Features'],
              ['#faq', 'FAQ'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="rounded-full px-3.5 py-2 transition hover:bg-[#f2f4f8] hover:text-[#151b2c]">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-medium text-[#344054] transition hover:bg-[#f2f4f8] sm:inline-flex">
              Log in
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#151b2c] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#252d45]"
            >
              Try the demo <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[linear-gradient(180deg,#f5f5ff_0%,#ffffff_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[linear-gradient(to_right,rgba(21,27,44,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(21,27,44,0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-14 px-5 pb-20 pt-14 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:px-8 lg:pb-28 lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#dfe1fb] bg-white px-3 py-1 text-xs font-medium text-[#4b4fe0] shadow-sm">
              <span className="size-1.5 rounded-full bg-[#5b5ef0]" /> Invoice OCR with source evidence
            </p>
            <h1 className="mt-6 text-[44px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[58px] lg:text-[64px]">
              Invoice data you can check, not just trust.
            </h1>
            <p className="mt-6 max-w-[520px] text-lg leading-8 text-[#5d6679]">
              Readly reads PDFs, scans and phone photos, extracts the fields and line items, and shows exactly where on
              the page each value came from.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#5b5ef0] px-6 text-[15px] font-medium text-white shadow-[0_12px_28px_rgba(91,94,240,0.32)] transition hover:bg-[#4b4fe0]"
              >
                Open the workspace <ArrowRight className="size-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[#d0d5dd] bg-white px-6 text-[15px] font-medium text-[#344054] transition hover:bg-[#f9fafb]"
              >
                See how it works
              </a>
            </div>
            <dl className="mt-10 grid max-w-[480px] grid-cols-3 gap-4 border-t border-[#eaecf0] pt-6">
              {[
                ['3', 'input types: PDF, scan, photo'],
                ['4', 'automatic quality checks'],
                ['0', 'files uploaded to a server'],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-3xl font-semibold tracking-[-0.03em]">{value}</dt>
                  <dd className="mt-1 text-sm leading-5 text-[#667085]">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section id="how" className="scroll-mt-20 border-t border-[#eaecf0] bg-[#f8f9fc] px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-[640px]">
            <p className="text-sm font-semibold text-[#4b4fe0]">How it works</p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[44px]">
              From a stack of invoices to approved records.
            </h2>
          </div>
          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="relative rounded-[24px] border border-[#eaecf0] bg-white p-7 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-[14px] bg-[#eef0ff] text-[#4b4fe0]">
                      <Icon className="size-5" />
                    </span>
                    <span className="font-mono text-sm text-[#98a2b3]">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em]">{step.title}</h3>
                  <p className="mt-2.5 text-[15px] leading-7 text-[#5d6679]">{step.copy}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section id="cleanup" className="scroll-mt-20 px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold text-[#4b4fe0]">Computer vision clean-up</p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[44px]">
              Phone photos get a second, cleaner reading.
            </h2>
            <p className="mt-5 text-[17px] leading-8 text-[#5d6679]">
              When the first OCR pass is incomplete or inconsistent, Readly prepares a cleaned copy of the page and reads
              it again, then keeps whichever result is more complete and balances.
            </p>
            <ul className="mt-7 space-y-4">
              {[
                ['Levelling', 'Finds the tilt from text-line alignment and rotates the page flat.'],
                ['Shadow flattening', 'Adaptive thresholding evens out lighting across the page.'],
                ['Table-rule removal', 'Long horizontal and vertical lines are erased so rows read as rows.'],
                ['Row rebuilding', 'Words are regrouped by baseline, so each line item keeps its quantity and price.'],
              ].map(([title, copy]) => (
                <li key={title} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#5b5ef0]" />
                  <p className="text-[15px] leading-7 text-[#5d6679]">
                    <b className="font-semibold text-[#151b2c]">{title}.</b> {copy}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <CleanCompare />
            <p className="mt-3 text-center text-sm text-[#667085]">Drag to compare the photo with the image the OCR engine reads.</p>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 bg-[#151b2c] px-5 py-20 text-white lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 className="max-w-[560px] text-[34px] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[44px]">
              Built for the review step, not around it.
            </h2>
            <p className="max-w-[380px] text-[15px] leading-7 text-white/60">
              Automation does the typing. A person stays in control of what gets exported.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[24px] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="bg-[#151b2c] p-7">
                  <Icon className="size-5 text-[#9fa1ff]" />
                  <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em]">{feature.title}</h3>
                  <p className="mt-2 text-[15px] leading-7 text-white/60">{feature.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
          <div className="order-2 overflow-hidden rounded-[24px] bg-[#0f1424] shadow-[0_30px_70px_rgba(21,27,44,0.2)] lg:order-1">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5 text-sm text-white/70">
              <Braces className="size-4 text-[#9fa1ff]" /> bw-10427.json
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-6 text-[#d6dcf0]">{`{
  "vendor": "BRIGHTWAVE DIGITAL LTD",
  "invoiceNumber": "BW-10427",
  "invoiceDate": "September 3, 2026",
  "dueDate": "October 3, 2026",
  "currency": "GBP",
  "subtotal": 3060,
  "tax": 612,
  "total": 3672,
  "lineItems": [
    { "description": "Website redesign",
      "quantity": 1, "unitPrice": 2400, "total": 2400 },
    { "description": "Hosting (12 months)",
      "quantity": 12, "unitPrice": 25, "total": 300 },
    { "description": "SEO audit",
      "quantity": 2, "unitPrice": 180, "total": 360 }
  ],
  "extractionMethod": "ocr-enhanced",
  "reviewStatus": "approved"
}`}</pre>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold text-[#4b4fe0]">Outputs</p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[44px]">
              Clean records in the format your tools expect.
            </h2>
            <p className="mt-5 text-[17px] leading-8 text-[#5d6679]">
              This is the actual output for the sample phone photo above. Export one invoice or the whole batch.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                ['JSON', 'For APIs and automations'],
                ['CSV', 'One row per line item'],
                ['Excel', 'Summary and items sheets'],
                ['Typed PDF', 'A clean, printable copy'],
              ].map(([name, detail]) => (
                <div key={name} className="rounded-[16px] border border-[#eaecf0] p-4">
                  <p className="flex items-center gap-2 font-semibold">
                    <FileText className="size-4 text-[#5b5ef0]" /> {name}
                  </p>
                  <p className="mt-1 text-sm text-[#667085]">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 border-t border-[#eaecf0] bg-[#f8f9fc] px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold text-[#4b4fe0]">FAQ</p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.035em]">Straight answers.</h2>
            <p className="mt-4 text-[15px] leading-7 text-[#5d6679]">
              OCR is never perfect. Readly is designed to show you where it might be wrong.
            </p>
          </div>
          <div className="divide-y divide-[#eaecf0] rounded-[20px] border border-[#eaecf0] bg-white">
            {faqs.map((faq) => (
              <details key={faq.q} className="group p-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold">
                  {faq.q}
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#f2f4f8] text-[#667085] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-[15px] leading-7 text-[#5d6679]">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[32px] bg-[#5b5ef0] px-8 py-14 text-white sm:px-14 sm:py-16">
          <div className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full border border-white/20" />
          <div className="pointer-events-none absolute -right-48 top-10 size-[520px] rounded-full border border-white/10" />
          <div className="relative max-w-[600px]">
            <h2 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[44px]">
              Try it on your own invoice.
            </h2>
            <p className="mt-4 text-[17px] leading-8 text-white/75">
              No account needed. Your file stays in your browser, and three sample documents are ready if you would rather
              not use your own.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-medium text-[#151b2c] transition hover:bg-[#f2f2ff]"
            >
              Open the workspace <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-5 pb-10 lg:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-5 border-t border-[#eaecf0] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Brand compact />
            <span className="text-sm text-[#98a2b3]">Invoice OCR portfolio demo</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#667085]">
            <a href="#how" className="hover:text-[#151b2c]">How it works</a>
            <a href="#faq" className="hover:text-[#151b2c]">FAQ</a>
            <Link href="/login" className="hover:text-[#151b2c]">Workspace</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
