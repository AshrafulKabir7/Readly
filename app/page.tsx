'use client';

import { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSearch,
  FileText,
  LockKeyhole,
  RotateCcw,
  ScanLine,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Progress,
  ProgressLabel,
} from '@/components/ui/progress';
import { processDocument } from '@/lib/document-ocr';
import {
  formatMoney,
  sampleInvoice,
  type InvoiceData,
} from '@/lib/invoice';

type Status = 'ready' | 'processing' | 'error';
type ExportFormat = 'json' | 'csv' | 'xlsx';
type TextField =
  | 'vendor'
  | 'invoiceNumber'
  | 'invoiceDate'
  | 'dueDate'
  | 'currency';

const textFields: Array<{ key: TextField; label: string }> = [
  { key: 'vendor', label: 'Vendor' },
  { key: 'invoiceNumber', label: 'Invoice number' },
  { key: 'invoiceDate', label: 'Invoice date' },
  { key: 'dueDate', label: 'Due date' },
];

function downloadBlob(content: BlobPart, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeFileStem(invoiceNumber: string) {
  return (invoiceNumber || 'invoice-extraction')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [invoice, setInvoice] = useState<InvoiceData>(sampleInvoice);
  const [fileName, setFileName] = useState('northstar-invoice.pdf');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [status, setStatus] = useState<Status>('ready');
  const [progress, setProgress] = useState(100);
  const [progressLabel, setProgressLabel] = useState('Ready to review');
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState<'fields' | 'raw'>('fields');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');

  async function handleFile(file?: File) {
    if (!file || status === 'processing') return;

    setFileName(file.name);
    setStatus('processing');
    setError('');
    setProgress(4);
    setProgressLabel('Validating document');

    try {
      const result = await processDocument(file, (next) => {
        setProgress(next.value);
        setProgressLabel(next.label);
      });
      setInvoice(result.data);
      setPreviewUrl(result.previewUrl);
      setPageCount(result.pages);
      setActiveView('fields');
      setStatus('ready');
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'The document could not be processed.',
      );
      setStatus('error');
      setProgress(0);
    }
  }

  function loadSample() {
    setInvoice(sampleInvoice);
    setFileName('northstar-invoice.pdf');
    setPreviewUrl(null);
    setPageCount(1);
    setStatus('ready');
    setProgress(100);
    setProgressLabel('Ready to review');
    setError('');
    setActiveView('fields');
  }

  function updateTextField(key: TextField, value: string) {
    setInvoice((current) => ({ ...current, [key]: value }));
  }

  async function exportInvoice() {
    const stem = safeFileStem(invoice.invoiceNumber);

    if (exportFormat === 'json') {
      downloadBlob(
        JSON.stringify(invoice, null, 2),
        `${stem}.json`,
        'application/json',
      );
      return;
    }

    const summaryRows = [
      ['Field', 'Value'],
      ['Vendor', invoice.vendor],
      ['Invoice number', invoice.invoiceNumber],
      ['Invoice date', invoice.invoiceDate],
      ['Due date', invoice.dueDate],
      ['Currency', invoice.currency],
      ['Subtotal', invoice.subtotal],
      ['Tax', invoice.tax],
      ['Total', invoice.total],
    ];

    if (exportFormat === 'csv') {
      const csv = [
        ...summaryRows,
        [],
        ['Description', 'Quantity', 'Total'],
        ...invoice.lineItems.map((item) => [
          item.description,
          item.quantity,
          item.total,
        ]),
      ]
        .map((row) =>
          row
            .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
            .join(','),
        )
        .join('\n');
      downloadBlob(csv, `${stem}.csv`, 'text/csv;charset=utf-8');
      return;
    }

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LumenDoc';

    const summarySheet = workbook.addWorksheet('Invoice');
    summarySheet.addRows(summaryRows);
    summarySheet.getColumn(1).width = 22;
    summarySheet.getColumn(2).width = 32;
    summarySheet.getRow(1).font = { bold: true };

    const itemsSheet = workbook.addWorksheet('Line items');
    itemsSheet.columns = [
      { header: 'Description', key: 'description', width: 38 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Total', key: 'total', width: 16 },
    ];
    itemsSheet.addRows(invoice.lineItems);
    itemsSheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    downloadBlob(
      buffer as BlobPart,
      `${stem}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  }

  const foundFields = [
    invoice.vendor,
    invoice.invoiceNumber,
    invoice.invoiceDate,
    invoice.dueDate,
    invoice.subtotal,
    invoice.tax,
    invoice.total,
    invoice.lineItems.length ? 'items' : '',
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80 bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(21,92,75,0.2)]">
              <ScanLine className="size-5" strokeWidth={2.1} />
            </div>
            <div>
              <p className="font-heading text-[15px] font-bold tracking-[-0.02em]">
                LumenDoc
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Document intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Badge
              variant="outline"
              className="hidden h-8 gap-1.5 rounded-full border-primary/15 bg-primary/[0.04] px-3 text-[11px] font-semibold text-primary sm:flex"
            >
              <LockKeyhole className="size-3.5" />
              Processed in your browser
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={loadSample}
            >
              <RotateCcw className="size-3.5" />
              Sample
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1480px] px-5 py-8 lg:px-8 lg:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              <Sparkles className="size-4" />
              AI document workspace
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-[-0.04em] sm:text-4xl lg:text-[46px] lg:leading-[1.08]">
              Turn invoices into clean data.
              <span className="text-muted-foreground"> In seconds.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Upload an invoice, review the extracted fields, and export
              structured data without copying a single line by hand.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-sm">
            <Metric label="Fields found" value={String(foundFields)} />
            <div className="h-8 w-px bg-border" />
            <Metric
              label="Avg. confidence"
              value={`${invoice.confidence.toFixed(1)}%`}
              accent
            />
            <div className="h-8 w-px bg-border" />
            <Metric
              label="Processing"
              value={`${(invoice.processingMs / 1000).toFixed(1)}s`}
            />
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(560px,1.08fr)]">
          <section className="overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_20px_60px_rgba(20,43,37,0.07)]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
              <div>
                <p className="font-heading text-sm font-bold">
                  Source document
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  PDF, PNG or JPG up to 10 MB
                </p>
              </div>
              <Badge className="rounded-full bg-accent px-3 text-[11px] font-bold text-accent-foreground hover:bg-accent">
                Page 1 of {pageCount}
              </Badge>
            </div>

            <div className="bg-[#e8eeeb] p-4 sm:p-6">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  void handleFile(event.dataTransfer.files[0]);
                }}
                disabled={status === 'processing'}
                className="group relative mb-4 flex w-full items-center justify-between rounded-2xl border border-dashed border-primary/25 bg-white/75 px-4 py-3 text-left transition hover:border-primary/55 hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-wait disabled:opacity-70"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <UploadCloud className="size-4.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold">
                      Drop a document or browse
                    </span>
                    <span className="mt-0.5 block max-w-[280px] truncate text-[11px] text-muted-foreground">
                      {fileName}
                    </span>
                  </span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Choose file
                </span>
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                className="sr-only"
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />

              {status === 'processing' && (
                <Progress
                  value={progress}
                  className="mb-4 rounded-xl border border-primary/10 bg-white/80 p-3"
                >
                  <ProgressLabel className="text-xs">
                    {progressLabel}
                  </ProgressLabel>
                  <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                    {progress}%
                  </span>
                </Progress>
              )}

              {error && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/20 bg-white p-3 text-xs text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {previewUrl ? (
                <div className="mx-auto flex min-h-[540px] max-w-[500px] items-center justify-center overflow-hidden rounded-[18px] bg-white p-4 shadow-[0_18px_42px_rgba(21,52,43,0.14)]">
                  {/* Uploaded files are local object/data URLs selected by the user. */}
                  <img
                    src={previewUrl}
                    alt={`Preview of ${fileName}`}
                    className="max-h-[660px] w-full object-contain"
                  />
                </div>
              ) : (
                <SampleDocument invoice={invoice} />
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_20px_60px_rgba(20,43,37,0.07)]">
            <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  {status === 'processing' ? (
                    <FileSearch className="size-4.5 animate-pulse" />
                  ) : status === 'error' ? (
                    <AlertCircle className="size-4.5 text-destructive" />
                  ) : (
                    <CheckCircle2 className="size-4.5" />
                  )}
                </div>
                <div>
                  <p className="font-heading text-sm font-bold">
                    {status === 'processing'
                      ? progressLabel
                      : status === 'error'
                        ? 'Extraction needs attention'
                        : 'Extraction complete'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Review fields before exporting
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  aria-label="Export format"
                  value={exportFormat}
                  onChange={(event) =>
                    setExportFormat(event.target.value as ExportFormat)
                  }
                  className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none focus:ring-3 focus:ring-ring/30"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel</option>
                </select>
                <Button
                  size="sm"
                  className="h-9 rounded-xl px-3 shadow-[0_8px_20px_rgba(21,92,75,0.18)]"
                  disabled={status !== 'ready'}
                  onClick={() => void exportInvoice()}
                >
                  <Download className="size-3.5" /> Export
                </Button>
              </div>
            </div>

            <div className="px-5 pt-5 sm:px-6">
              <div className="grid grid-cols-2 rounded-xl bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setActiveView('fields')}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition ${activeView === 'fields' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                >
                  Extracted data
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('raw')}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition ${activeView === 'raw' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                >
                  Raw OCR text
                </button>
              </div>
            </div>

            {activeView === 'raw' ? (
              <div className="p-5 sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Recognized text
                  </p>
                  <Badge variant="secondary" className="rounded-full">
                    {invoice.rawText.split(/\s+/).filter(Boolean).length} words
                  </Badge>
                </div>
                <pre className="min-h-[550px] overflow-auto whitespace-pre-wrap rounded-2xl border border-border bg-[#173f35] p-5 font-mono text-xs leading-6 text-[#ddede7]">
                  {invoice.rawText || 'No text was recognized.'}
                </pre>
              </div>
            ) : (
              <div className="p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Document fields
                  </p>
                  <p className="text-xs font-semibold text-primary">
                    Editable results
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {textFields.map((field) => (
                    <label
                      key={field.key}
                      className="rounded-2xl border border-border bg-background p-3.5 transition focus-within:border-primary/40 focus-within:ring-3 focus-within:ring-primary/10"
                    >
                      <span className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                        {field.label}
                        <span className="rounded-full bg-primary/8 px-2 py-0.5 text-[9px] text-primary">
                          {Math.round(invoice.confidence)}%
                        </span>
                      </span>
                      <input
                        value={invoice[field.key]}
                        onChange={(event) =>
                          updateTextField(field.key, event.target.value)
                        }
                        className="mt-2 w-full bg-transparent text-sm font-semibold outline-none"
                      />
                    </label>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Line items
                    </p>
                    <button
                      type="button"
                      className="text-xs font-bold text-primary hover:underline"
                      onClick={() =>
                        setInvoice((current) => ({
                          ...current,
                          lineItems: [
                            ...current.lineItems,
                            { description: 'New item', quantity: 1, total: 0 },
                          ],
                        }))
                      }
                    >
                      + Add row
                    </button>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-border">
                    <div className="grid grid-cols-[1fr_52px_92px] bg-muted/65 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      <span>Description</span>
                      <span>Qty</span>
                      <span className="text-right">Total</span>
                    </div>
                    {invoice.lineItems.length ? (
                      invoice.lineItems.map((item, index) => (
                        <div
                          key={`${item.description}-${index}`}
                          className="grid grid-cols-[1fr_52px_92px] border-t border-border px-4 py-3 text-xs"
                        >
                          <span className="truncate pr-2 font-medium">
                            {item.description}
                          </span>
                          <span className="text-muted-foreground">
                            {item.quantity}
                          </span>
                          <span className="text-right font-semibold">
                            {formatMoney(item.total, invoice.currency)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
                        No line items were confidently detected. Add one or edit
                        the exported file.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_220px]">
                  <div className="flex items-start gap-3 rounded-2xl bg-accent/70 p-4 text-accent-foreground">
                    <FileText className="mt-0.5 size-4 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">
                        Ready for your workflow
                      </p>
                      <p className="mt-1 text-[11px] leading-4 opacity-70">
                        Edit any value, then export clean data for accounting or
                        automation.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#163f35] p-4 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                      Total due
                    </p>
                    <p className="mt-1.5 font-heading text-2xl font-black tracking-[-0.03em]">
                      {formatMoney(invoice.total, invoice.currency)}
                    </p>
                    <p className="mt-1 text-[10px] text-white/55">
                      {invoice.currency} · extracted total
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <footer className="flex flex-col gap-3 px-1 pb-2 pt-6 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Documents are processed locally and are not retained.</p>
          <p>OCR confidence varies by image quality and document layout.</p>
        </footer>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-heading text-xl font-bold ${accent ? 'text-primary' : ''}`}
      >
        {value}
      </p>
    </div>
  );
}

function SampleDocument({ invoice }: { invoice: InvoiceData }) {
  return (
    <div className="mx-auto max-w-[460px] rounded-[18px] bg-white p-7 shadow-[0_18px_42px_rgba(21,52,43,0.14)] sm:p-9">
      <div className="flex items-start justify-between border-b border-[#dfe5e2] pb-7">
        <div>
          <div className="mb-2 h-2.5 w-28 rounded-full bg-[#173f35]" />
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#618078]">
            {invoice.vendor}
          </p>
        </div>
        <div className="text-right">
          <p className="font-heading text-2xl font-black tracking-[-0.04em] text-[#173f35]">
            INVOICE
          </p>
          <p className="mt-1 text-[9px] font-semibold text-[#759089]">
            #{invoice.invoiceNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 py-6 text-[9px] leading-4 text-[#61756f]">
        <div>
          <p className="mb-1 font-bold uppercase tracking-wider text-[#173f35]">
            Bill to
          </p>
          <p>Acme Creative Studio</p>
          <p>82 Market Street</p>
          <p>Portland, OR 97205</p>
        </div>
        <div className="text-right">
          <p>
            <span className="font-bold text-[#173f35]">Issued</span>{' '}
            {invoice.invoiceDate}
          </p>
          <p>
            <span className="font-bold text-[#173f35]">Due</span>{' '}
            {invoice.dueDate}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#dfe5e2]">
        <div className="grid grid-cols-[1fr_34px_70px] bg-[#edf3f0] px-3 py-2 text-[8px] font-bold uppercase tracking-wider text-[#4a665e]">
          <span>Description</span>
          <span>Qty</span>
          <span className="text-right">Amount</span>
        </div>
        {invoice.lineItems.map((item, index) => (
          <div
            key={`${item.description}-${index}`}
            className="grid grid-cols-[1fr_34px_70px] border-t border-[#e7ece9] px-3 py-2.5 text-[9px] text-[#4f6861]"
          >
            <span>{item.description}</span>
            <span>{item.quantity}</span>
            <span className="text-right font-semibold text-[#173f35]">
              {formatMoney(item.total, invoice.currency)}
            </span>
          </div>
        ))}
      </div>

      <div className="ml-auto mt-6 w-44 space-y-2 text-[9px]">
        <div className="flex justify-between text-[#6e817c]">
          <span>Subtotal</span>
          <span>{formatMoney(invoice.subtotal, invoice.currency)}</span>
        </div>
        <div className="flex justify-between text-[#6e817c]">
          <span>Tax</span>
          <span>{formatMoney(invoice.tax, invoice.currency)}</span>
        </div>
        <div className="flex justify-between border-t border-[#dfe5e2] pt-2.5 font-heading text-sm font-black text-[#173f35]">
          <span>Total</span>
          <span>{formatMoney(invoice.total, invoice.currency)}</span>
        </div>
      </div>
    </div>
  );
}
