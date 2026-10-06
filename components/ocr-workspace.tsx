'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crosshair,
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  House,
  Layers,
  Loader2,
  LockKeyhole,
  LogOut,
  Minus,
  Plus,
  RotateCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';

import { Brand } from '@/components/brand';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MAX_PAGES, processDocument, type OcrResult } from '@/lib/document-ocr';
import {
  emptyInvoice,
  formatMoney,
  type EvidenceField,
  type InvoiceData,
  type InvoiceLineItem,
} from '@/lib/invoice';

type DocStatus = 'queued' | 'processing' | 'ready' | 'error';
type ExportFormat = 'json' | 'csv' | 'xlsx' | 'pdf';
type ActiveView = 'details' | 'items' | 'raw';
type TextField = 'vendor' | 'invoiceNumber' | 'invoiceDate' | 'dueDate';
type MoneyField = 'subtotal' | 'tax' | 'total';
type Focus = { kind: 'field'; key: EvidenceField } | { kind: 'item'; index: number } | null;

type DocEntry = {
  id: string;
  file: File;
  name: string;
  status: DocStatus;
  progress: number;
  progressLabel: string;
  error: string;
  result: OcrResult | null;
  invoice: InvoiceData;
  /** Source line for each current line item (-1 for rows added by hand). */
  itemEvidence: number[];
  approved: boolean;
  edited: boolean;
};

const samples = [
  {
    file: 'northwind-invoice.pdf',
    type: 'application/pdf',
    title: 'Digital PDF',
    detail: 'US invoice · text layer',
    thumb: '/samples/northwind-invoice-thumb.png',
  },
  {
    file: 'brightwave-photo.jpg',
    type: 'image/jpeg',
    title: 'Phone photo',
    detail: 'UK invoice · skewed, bordered table',
    thumb: '/samples/brightwave-photo.jpg',
  },
  {
    file: 'kestrel-receipt.png',
    type: 'image/png',
    title: 'Scanned receipt',
    detail: 'Monospace columns',
    thumb: '/samples/kestrel-receipt.png',
  },
];

const textFields: Array<{ key: TextField; label: string; placeholder: string }> = [
  { key: 'vendor', label: 'Vendor', placeholder: 'Vendor name' },
  { key: 'invoiceNumber', label: 'Invoice number', placeholder: 'INV-0000' },
  { key: 'invoiceDate', label: 'Invoice date', placeholder: 'Month DD, YYYY' },
  { key: 'dueDate', label: 'Due date', placeholder: 'Month DD, YYYY' },
];

const moneyFields: Array<{ key: MoneyField; label: string }> = [
  { key: 'subtotal', label: 'Subtotal' },
  { key: 'tax', label: 'Tax' },
  { key: 'total', label: 'Total' },
];

const fieldLabels: Record<EvidenceField, string> = {
  vendor: 'Vendor',
  invoiceNumber: 'Invoice number',
  invoiceDate: 'Invoice date',
  dueDate: 'Due date',
  subtotal: 'Subtotal',
  tax: 'Tax',
  total: 'Total',
};

const methodLabels: Record<OcrResult['method'], string> = {
  'pdf-text': 'PDF text layer',
  ocr: 'OCR',
  'ocr-enhanced': 'OCR + image clean-up',
};

function downloadBlob(content: BlobPart, fileName: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFileStem(value: string) {
  return (
    (value || 'invoice-extraction')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '') || 'invoice-extraction'
  );
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function toneFor(confidence: number) {
  if (confidence >= 90) return { text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'border-emerald-500', fill: 'bg-emerald-500/10' };
  if (confidence >= 75) return { text: 'text-amber-700', dot: 'bg-amber-500', ring: 'border-amber-500', fill: 'bg-amber-500/10' };
  return { text: 'text-red-700', dot: 'bg-red-500', ring: 'border-red-500', fill: 'bg-red-500/10' };
}

function csvCell(value: string | number | undefined) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function updateItemValue(item: InvoiceLineItem, key: keyof InvoiceLineItem, value: string): InvoiceLineItem {
  if (key === 'description') return { ...item, description: value };
  const next = { ...item, [key]: Number(value) || 0 };
  if (key === 'quantity' || key === 'unitPrice') next.total = roundMoney(next.quantity * next.unitPrice);
  else if (key === 'total' && next.quantity > 0) next.unitPrice = roundMoney(next.total / next.quantity);
  return next;
}

function qualityChecks(invoice: InvoiceData) {
  const itemTotal = roundMoney(invoice.lineItems.reduce((sum, item) => sum + item.total, 0));
  const lineItemsMatch = Math.abs(itemTotal - invoice.subtotal) < 0.02;
  const totalsBalance = Math.abs(invoice.subtotal + invoice.tax - invoice.total) < 0.02;
  const checks = [
    {
      label: 'Invoice identity',
      detail: invoice.vendor && invoice.invoiceNumber ? `${invoice.vendor} · ${invoice.invoiceNumber}` : 'Vendor or invoice number missing',
      passing: Boolean(invoice.vendor.trim() && invoice.invoiceNumber.trim()),
    },
    {
      label: 'Payment dates',
      detail: invoice.invoiceDate && invoice.dueDate ? 'Issue and due dates found' : 'A date needs review',
      passing: Boolean(invoice.invoiceDate && invoice.dueDate),
    },
    {
      label: 'Line item sum',
      detail: invoice.lineItems.length
        ? lineItemsMatch
          ? `${invoice.lineItems.length} rows add up to the subtotal`
          : `Rows add up to ${formatMoney(itemTotal, invoice.currency)}`
        : 'No line items yet',
      passing: invoice.lineItems.length > 0 && lineItemsMatch,
    },
    {
      label: 'Invoice balance',
      detail: totalsBalance ? 'Subtotal + tax = total' : 'Subtotal + tax does not equal total',
      passing: invoice.total > 0 && totalsBalance,
    },
  ];
  const passed = checks.filter((check) => check.passing).length;
  return { checks, passed, itemTotal, lineItemsMatch, totalsBalance, ready: passed === checks.length };
}

function fieldsFound(invoice: InvoiceData) {
  return [
    invoice.vendor,
    invoice.invoiceNumber,
    invoice.invoiceDate,
    invoice.dueDate,
    invoice.subtotal,
    invoice.tax,
    invoice.total,
    invoice.lineItems.length ? 'items' : '',
  ].filter(Boolean).length;
}

let nextId = 1;

export default function OcrWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('details');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [feedback, setFeedback] = useState('');
  const [creatingPdf, setCreatingPdf] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [focus, setFocus] = useState<Focus>(null);
  const [page, setPage] = useState(0);
  const [showBoxes, setShowBoxes] = useState(false);
  const [zoom, setZoom] = useState(1);

  const active = docs.find((doc) => doc.id === activeId) ?? null;
  const queueRef = useRef<DocEntry[]>([]);
  const runningRef = useRef(false);

  const patchDoc = useCallback((id: string, patch: Partial<DocEntry> | ((doc: DocEntry) => Partial<DocEntry>)) => {
    setDocs((current) =>
      current.map((doc) => (doc.id === id ? { ...doc, ...(typeof patch === 'function' ? patch(doc) : patch) } : doc)),
    );
  }, []);

  // One document at a time: the OCR engine runs in a single worker.
  async function pump() {
    if (runningRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    runningRef.current = true;
    patchDoc(next.id, { status: 'processing', progress: 3, progressLabel: 'Validating document' });
    try {
      const result = await processDocument(next.file, (progress) =>
        patchDoc(next.id, { progress: progress.value, progressLabel: progress.label }),
      );
      patchDoc(next.id, {
        status: 'ready',
        progress: 100,
        progressLabel: 'Ready to review',
        result,
        invoice: result.data,
        itemEvidence: result.evidence.items,
      });
    } catch (reason) {
      patchDoc(next.id, {
        status: 'error',
        progress: 0,
        error: reason instanceof Error ? reason.message : 'The document could not be processed.',
      });
    } finally {
      runningRef.current = false;
      void pump();
    }
  }

  function enqueue(files: File[]) {
    if (!files.length) return;
    const entries = files.map<DocEntry>((file) => ({
      id: `doc-${nextId++}`,
      file,
      name: file.name,
      status: 'queued',
      progress: 0,
      progressLabel: 'Waiting in queue',
      error: '',
      result: null,
      invoice: emptyInvoice,
      itemEvidence: [],
      approved: false,
      edited: false,
    }));
    setDocs((current) => [...current, ...entries]);
    queueRef.current.push(...entries);
    setActiveId(entries[0].id);
    setPage(0);
    setFocus(null);
    setActiveView('details');
    setFeedback(entries.length > 1 ? `${entries.length} documents added to the queue.` : '');
    void pump();
  }

  async function loadSample(sample: (typeof samples)[number]) {
    try {
      const response = await fetch(`/samples/${sample.file}`);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      enqueue([new File([blob], sample.file, { type: sample.type })]);
    } catch {
      setFeedback('The sample could not be loaded. Check your connection and try again.');
    }
  }

  function removeDoc(id: string) {
    const doc = docs.find((item) => item.id === id);
    doc?.result?.pages.forEach((item) => item.url.startsWith('blob:') && URL.revokeObjectURL(item.url));
    const remaining = docs.filter((item) => item.id !== id);
    queueRef.current = queueRef.current.filter((item) => item.id !== id);
    setDocs(remaining);
    if (activeId === id) setActiveId(remaining[0]?.id ?? null);
    setFocus(null);
    setPage(0);
  }

  function selectDoc(id: string) {
    setActiveId(id);
    setFocus(null);
    setPage(0);
  }

  function editInvoice(update: (invoice: InvoiceData) => InvoiceData, itemEvidence?: (current: number[]) => number[]) {
    if (!active) return;
    patchDoc(active.id, (doc) => ({
      invoice: update(doc.invoice),
      itemEvidence: itemEvidence ? itemEvidence(doc.itemEvidence) : doc.itemEvidence,
      approved: false,
      edited: true,
    }));
    if (active.approved) setFeedback('Edits reopened the review. Approve again before exporting.');
  }

  const invoice = active?.invoice ?? emptyInvoice;
  const result = active?.result ?? null;
  const quality = qualityChecks(invoice);

  const focusLineIndex =
    result && focus
      ? focus.kind === 'field'
        ? result.evidence.fields[focus.key]
        : active?.itemEvidence[focus.index]
      : undefined;
  const focusLine = focusLineIndex !== undefined && focusLineIndex >= 0 ? result?.lines[focusLineIndex] : undefined;

  // A focused value always shows the page it was read from.
  const viewPage = focusLine ? focusLine.page : page;

  function fieldConfidence(key: EvidenceField) {
    const index = result?.evidence.fields[key];
    return index !== undefined ? result?.lines[index]?.confidence : undefined;
  }

  const exportPayload = {
    ...invoice,
    sourceFile: active?.name,
    extractionMethod: result?.method,
    reviewStatus: active?.approved ? 'approved' : 'draft',
  };

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
      setFeedback('JSON copied to the clipboard.');
    } catch {
      setFeedback('Clipboard access was blocked by the browser.');
    }
  }

  async function exportCleanPdf() {
    if (!active) return;
    const stem = safeFileStem(invoice.invoiceNumber || active.name);
    setCreatingPdf(true);
    try {
      const { createInvoicePdf } = await import('@/lib/invoice-pdf');
      const pdfBytes = await createInvoicePdf(invoice, active.approved);
      downloadBlob(pdfBytes as BlobPart, `${stem}-typed.pdf`, 'application/pdf');
      setFeedback(`Downloaded ${stem}-typed.pdf`);
    } catch {
      setFeedback('The typed PDF could not be created. Please try again.');
    } finally {
      setCreatingPdf(false);
    }
  }

  function summaryRows(doc: DocEntry) {
    const data = doc.invoice;
    return [
      ['Field', 'Value'],
      ['Source file', doc.name],
      ['Review status', doc.approved ? 'Approved' : 'Draft'],
      ['Vendor', data.vendor],
      ['Invoice number', data.invoiceNumber],
      ['Invoice date', data.invoiceDate],
      ['Due date', data.dueDate],
      ['Currency', data.currency],
      ['Subtotal', data.subtotal],
      ['Tax', data.tax],
      ['Total', data.total],
    ];
  }

  async function exportInvoice() {
    if (!active) return;
    const stem = safeFileStem(invoice.invoiceNumber || active.name);
    if (exportFormat === 'pdf') return exportCleanPdf();
    if (exportFormat === 'json') {
      downloadBlob(JSON.stringify(exportPayload, null, 2), `${stem}.json`, 'application/json');
      return setFeedback(`Exported ${stem}.json`);
    }
    if (exportFormat === 'csv') {
      const csv = [
        ...summaryRows(active),
        [],
        ['Description', 'Quantity', 'Unit price', 'Total'],
        ...invoice.lineItems.map((item) => [item.description, item.quantity, item.unitPrice, item.total]),
      ]
        .map((row) => row.map(csvCell).join(','))
        .join('\n');
      downloadBlob(csv, `${stem}.csv`, 'text/csv;charset=utf-8');
      return setFeedback(`Exported ${stem}.csv`);
    }
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Readly';
    const summary = workbook.addWorksheet('Invoice');
    summary.addRows(summaryRows(active));
    summary.getColumn(1).width = 22;
    summary.getColumn(2).width = 36;
    summary.getRow(1).font = { bold: true };
    const items = workbook.addWorksheet('Line items');
    items.columns = [
      { header: 'Description', key: 'description', width: 38 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Unit price', key: 'unitPrice', width: 16 },
      { header: 'Total', key: 'total', width: 16 },
    ];
    items.addRows(invoice.lineItems);
    items.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    downloadBlob(buffer as BlobPart, `${stem}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    setFeedback(`Exported ${stem}.xlsx`);
  }

  function exportBatch() {
    const readyDocs = docs.filter((doc) => doc.status === 'ready');
    const header = [
      'Source file',
      'Review status',
      'Vendor',
      'Invoice number',
      'Invoice date',
      'Due date',
      'Currency',
      'Subtotal',
      'Tax',
      'Total',
      'Item description',
      'Quantity',
      'Unit price',
      'Item total',
    ];
    const rows = readyDocs.flatMap((doc) => {
      const data = doc.invoice;
      const base = [
        doc.name,
        doc.approved ? 'approved' : 'draft',
        data.vendor,
        data.invoiceNumber,
        data.invoiceDate,
        data.dueDate,
        data.currency,
        data.subtotal,
        data.tax,
        data.total,
      ];
      return data.lineItems.length
        ? data.lineItems.map((item) => [...base, item.description, item.quantity, item.unitPrice, item.total])
        : [[...base, '', '', '', '']];
    });
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    downloadBlob(csv, `readly-batch-${readyDocs.length}-invoices.csv`, 'text/csv;charset=utf-8');
    setFeedback(`Exported ${readyDocs.length} invoices to one CSV.`);
  }

  const readyCount = docs.filter((doc) => doc.status === 'ready').length;

  return (
    // The whole page is a drop zone; the visible upload buttons cover keyboard use.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <main
      className="min-h-screen bg-[#f3f5fa] text-[#151b2c]"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        enqueue([...event.dataTransfer.files]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="sr-only"
        aria-label="Upload invoices"
        onChange={(event) => {
          enqueue([...(event.target.files ?? [])]);
          event.target.value = '';
        }}
      />

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-[#151b2c]/40 p-6 backdrop-blur-sm">
          <div className="rounded-[28px] border-2 border-dashed border-white/70 bg-white/95 px-10 py-12 text-center shadow-2xl">
            <UploadCloud className="mx-auto size-10 text-[#5b5ef0]" />
            <p className="mt-4 text-lg font-semibold">Drop to add to the queue</p>
            <p className="mt-1 text-sm text-[#667085]">PDF, PNG, JPG or WebP · up to 15 MB each</p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-[#e2e6ef] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" aria-label="Readly home">
              <Brand compact />
            </Link>
            <span className="hidden h-6 w-px bg-[#e2e6ef] sm:block" />
            <p className="hidden truncate text-sm text-[#667085] sm:block">
              Invoice review{active ? <span className="text-[#151b2c]"> · {active.name}</span> : null}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="mr-1 hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 md:inline-flex">
              <LockKeyhole className="size-3.5" /> Processed in your browser
            </span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[#151b2c] px-4 text-sm font-medium text-white transition hover:bg-[#252d45]"
            >
              <UploadCloud className="size-4" /> <span className="hidden sm:inline">Upload</span>
            </button>
            <Link
              href="/"
              aria-label="Return home"
              className="grid size-9 place-items-center rounded-full text-[#667085] transition hover:bg-[#eef1f7] hover:text-[#151b2c]"
            >
              <House className="size-4" />
            </Link>
            <Link
              href="/login"
              aria-label="Sign out"
              onClick={() => sessionStorage.removeItem('readly-demo-session')}
              className="grid size-9 place-items-center rounded-full text-[#667085] transition hover:bg-[#eef1f7] hover:text-[#151b2c]"
            >
              <LogOut className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {!docs.length ? (
        <EmptyState onUpload={() => inputRef.current?.click()} onSample={loadSample} feedback={feedback} />
      ) : (
        <div className="mx-auto grid max-w-[1680px] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_minmax(460px,0.95fr)]">
          <DocumentRail
            docs={docs}
            activeId={activeId}
            onSelect={selectDoc}
            onRemove={removeDoc}
            onUpload={() => inputRef.current?.click()}
            onSample={loadSample}
            onExportBatch={exportBatch}
            readyCount={readyCount}
          />

          <SourceViewer
            doc={active}
            page={viewPage}
            onPage={setPage}
            focusLine={focusLine}
            focusLabel={
              focus?.kind === 'field'
                ? fieldLabels[focus.key]
                : focus?.kind === 'item'
                  ? `Line item ${focus.index + 1}`
                  : ''
            }
            showBoxes={showBoxes}
            onToggleBoxes={() => setShowBoxes((value) => !value)}
            zoom={zoom}
            onZoom={setZoom}
          />

          <section className="min-w-0 overflow-hidden rounded-[20px] border border-[#e2e6ef] bg-white shadow-[0_6px_24px_rgba(30,40,70,0.05)] lg:col-span-2 xl:col-span-1">
            {!active || active.status !== 'ready' ? (
              <ReviewPlaceholder doc={active} />
            ) : (
              <>
                <div className="border-b border-[#eceff5] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-xs font-medium text-[#667085]">
                        <Sparkles className="size-3.5 text-[#5b5ef0]" />
                        {result ? methodLabels[result.method] : ''}
                        {result?.method === 'ocr-enhanced' && result.skewAngle !== 0
                          ? ` · levelled ${Math.abs(result.skewAngle).toFixed(1)}°`
                          : ''}
                        {result && result.pageCount > 1
                          ? ` · ${Math.min(result.pageCount, MAX_PAGES)} of ${result.pageCount} pages`
                          : ''}
                      </p>
                      <h1 className="mt-1.5 text-xl font-semibold tracking-[-0.02em]">
                        {active.approved ? 'Record approved' : quality.ready ? 'Ready to approve' : 'Needs review'}
                      </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void copyJson()}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#dde2ec] px-3 text-sm font-medium text-[#344054] transition hover:bg-[#f5f7fb]"
                      >
                        <Copy className="size-3.5" /> Copy JSON
                      </button>
                      <div className="flex h-9 items-center rounded-full border border-[#dde2ec] pl-3">
                        <select
                          aria-label="Export format"
                          value={exportFormat}
                          onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
                          className="h-full bg-transparent pr-1 text-sm font-medium outline-none"
                        >
                          <option value="json">JSON</option>
                          <option value="csv">CSV</option>
                          <option value="xlsx">Excel</option>
                          <option value="pdf">Typed PDF</option>
                        </select>
                        <button
                          type="button"
                          disabled={creatingPdf}
                          onClick={() => void exportInvoice()}
                          className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#151b2c] px-4 text-sm font-medium text-white transition hover:bg-[#252d45] disabled:opacity-60"
                        >
                          {creatingPdf ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                          Export
                        </button>
                      </div>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Stat label="Fields" value={`${fieldsFound(invoice)}/8`} />
                    <Stat
                      label="Confidence"
                      value={`${invoice.confidence.toFixed(0)}%`}
                      tone={toneFor(invoice.confidence).text}
                    />
                    <Stat
                      label="Checks"
                      value={`${quality.passed}/${quality.checks.length}`}
                      tone={quality.ready ? 'text-emerald-700' : 'text-amber-700'}
                    />
                    <Stat label="Time" value={`${(invoice.processingMs / 1000).toFixed(1)}s`} />
                  </dl>
                  <p aria-live="polite" className="mt-3 min-h-5 text-xs text-[#667085]">
                    {feedback}
                  </p>
                </div>

                <Tabs value={activeView} onValueChange={(value) => setActiveView(value as ActiveView)} className="gap-0">
                  <div className="border-b border-[#eceff5] px-5 py-3">
                    <TabsList className="h-9 rounded-[12px] bg-[#f1f3f8] p-1">
                      <TabsTrigger value="details" className="h-7 rounded-[9px] px-3 text-xs data-active:bg-white">
                        Details
                      </TabsTrigger>
                      <TabsTrigger value="items" className="h-7 rounded-[9px] px-3 text-xs data-active:bg-white">
                        Line items
                        <span className="rounded-full bg-[#e4e7f0] px-1.5 text-[10px]">{invoice.lineItems.length}</span>
                      </TabsTrigger>
                      <TabsTrigger value="raw" className="h-7 rounded-[9px] px-3 text-xs data-active:bg-white">
                        Raw text
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="details" className="p-5">
                    <p className="flex items-center gap-1.5 text-xs text-[#667085]">
                      <Crosshair className="size-3.5 text-[#5b5ef0]" /> Hover or focus a field to see where it was read on
                      the page.
                    </p>
                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                      {textFields.map((field) => (
                        <FieldBox
                          key={field.key}
                          label={field.label}
                          confidence={fieldConfidence(field.key)}
                          missing={!invoice[field.key]}
                          active={focus?.kind === 'field' && focus.key === field.key}
                          onFocus={() => setFocus({ kind: 'field', key: field.key })}
                          onBlur={() => setFocus(null)}
                        >
                          <input
                            value={invoice[field.key]}
                            placeholder={field.placeholder}
                            onChange={(event) =>
                              editInvoice((current) => ({ ...current, [field.key]: event.target.value }))
                            }
                            className="mt-1 w-full bg-transparent text-sm font-semibold text-[#151b2c] outline-none placeholder:font-normal placeholder:text-[#a2a9b6]"
                          />
                        </FieldBox>
                      ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <h2 className="text-sm font-semibold">Amounts</h2>
                      <button
                        type="button"
                        onClick={() =>
                          editInvoice((current) => {
                            const subtotal = roundMoney(current.lineItems.reduce((sum, item) => sum + item.total, 0));
                            return { ...current, subtotal, total: roundMoney(subtotal + current.tax) };
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-[#4b4fe0] transition hover:bg-[#eef0ff]"
                      >
                        <RotateCw className="size-3.5" /> Recalculate from items
                      </button>
                    </div>
                    <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      <FieldBox label="Currency">
                        <select
                          value={invoice.currency}
                          onChange={(event) => editInvoice((current) => ({ ...current, currency: event.target.value }))}
                          className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
                        >
                          {['USD', 'EUR', 'GBP', 'BDT', 'INR', 'CAD', 'AUD'].map((currency) => (
                            <option key={currency} value={currency}>
                              {currency}
                            </option>
                          ))}
                        </select>
                      </FieldBox>
                      {moneyFields.map((field) => (
                        <FieldBox
                          key={field.key}
                          label={field.label}
                          confidence={fieldConfidence(field.key)}
                          missing={!invoice[field.key] && field.key !== 'tax'}
                          active={focus?.kind === 'field' && focus.key === field.key}
                          highlight={field.key === 'total'}
                          onFocus={() => setFocus({ kind: 'field', key: field.key })}
                          onBlur={() => setFocus(null)}
                        >
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={invoice[field.key]}
                            onChange={(event) =>
                              editInvoice((current) => ({ ...current, [field.key]: Number(event.target.value) || 0 }))
                            }
                            className="mt-1 w-full bg-transparent text-sm font-semibold tabular-nums outline-none"
                          />
                        </FieldBox>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-[16px] bg-[#151b2c] p-4 text-white">
                      <div>
                        <p className="text-xs text-white/55">Total due</p>
                        <p className="mt-0.5 text-2xl font-semibold tracking-[-0.03em] tabular-nums">
                          {formatMoney(invoice.total, invoice.currency)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${quality.totalsBalance ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-400/15 text-amber-200'}`}
                      >
                        {quality.totalsBalance ? 'Balanced' : 'Check totals'}
                      </span>
                    </div>
                  </TabsContent>

                  <TabsContent value="items" className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-[#667085]">Edit any cell. Quantity × price updates the row total.</p>
                      <button
                        type="button"
                        onClick={() =>
                          editInvoice(
                            (current) => ({
                              ...current,
                              lineItems: [
                                ...current.lineItems,
                                { description: 'New line item', quantity: 1, unitPrice: 0, total: 0 },
                              ],
                            }),
                            (evidence) => [...evidence, -1],
                          )
                        }
                        className="inline-flex h-8 items-center gap-1 rounded-full border border-[#dde2ec] px-3 text-xs font-medium transition hover:bg-[#f5f7fb]"
                      >
                        <Plus className="size-3.5" /> Add row
                      </button>
                    </div>
                    <div className="mt-3 overflow-x-auto rounded-[14px] border border-[#e2e6ef]">
                      <table className="w-full min-w-[520px] text-sm">
                        <thead className="bg-[#f6f7fb] text-left text-xs text-[#667085]">
                          <tr>
                            <th className="px-3 py-2.5 font-medium">Description</th>
                            <th className="w-16 px-2 py-2.5 font-medium">Qty</th>
                            <th className="w-24 px-2 py-2.5 text-right font-medium">Unit</th>
                            <th className="w-24 px-2 py-2.5 text-right font-medium">Total</th>
                            <th className="w-9"><span className="sr-only">Actions</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.lineItems.map((item, index) => {
                            const lineIndex = active.itemEvidence[index];
                            const source = lineIndex >= 0 ? result?.lines[lineIndex] : undefined;
                            return (
                              // Hover is a shortcut; keyboard users get the same highlight on focus.
                              // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
                              <tr
                                key={index}
                                className={`border-t border-[#eceff5] ${focus?.kind === 'item' && focus.index === index ? 'bg-[#f2f2ff]' : ''}`}
                                onMouseEnter={() => setFocus({ kind: 'item', index })}
                                onMouseLeave={() => setFocus(null)}
                                onFocus={() => setFocus({ kind: 'item', index })}
                              >
                                <td className="px-1.5 py-1">
                                  <div className="flex items-center gap-1.5">
                                    {source && (
                                      <span
                                        title={`Read at ${source.confidence}% confidence`}
                                        className={`size-1.5 shrink-0 rounded-full ${toneFor(source.confidence).dot}`}
                                      />
                                    )}
                                    <input
                                      aria-label={`Line ${index + 1} description`}
                                      value={item.description}
                                      onChange={(event) =>
                                        editInvoice((current) => ({
                                          ...current,
                                          lineItems: current.lineItems.map((row, rowIndex) =>
                                            rowIndex === index ? updateItemValue(row, 'description', event.target.value) : row,
                                          ),
                                        }))
                                      }
                                      className="w-full min-w-0 rounded-md bg-transparent px-1.5 py-1.5 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#5b5ef0]/25"
                                    />
                                  </div>
                                </td>
                                {(['quantity', 'unitPrice', 'total'] as const).map((key) => (
                                  <td key={key} className="px-1 py-1">
                                    <input
                                      aria-label={`Line ${index + 1} ${key === 'unitPrice' ? 'unit price' : key}`}
                                      type="number"
                                      min="0"
                                      step={key === 'quantity' ? '1' : '0.01'}
                                      value={item[key]}
                                      onChange={(event) =>
                                        editInvoice((current) => ({
                                          ...current,
                                          lineItems: current.lineItems.map((row, rowIndex) =>
                                            rowIndex === index ? updateItemValue(row, key, event.target.value) : row,
                                          ),
                                        }))
                                      }
                                      className={`w-full rounded-md bg-transparent px-1.5 py-1.5 tabular-nums outline-none focus:bg-white focus:ring-2 focus:ring-[#5b5ef0]/25 ${key === 'quantity' ? '' : 'text-right'} ${key === 'total' ? 'font-semibold' : ''}`}
                                    />
                                  </td>
                                ))}
                                <td className="pr-1.5">
                                  <button
                                    type="button"
                                    aria-label={`Remove line ${index + 1}`}
                                    onClick={() => {
                                      setFocus(null);
                                      editInvoice(
                                        (current) => ({
                                          ...current,
                                          lineItems: current.lineItems.filter((_, rowIndex) => rowIndex !== index),
                                        }),
                                        (evidence) => evidence.filter((_, rowIndex) => rowIndex !== index),
                                      );
                                    }}
                                    className="grid size-7 place-items-center rounded-full text-[#98a2b3] transition hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {!invoice.lineItems.length && (
                            <tr>
                              <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#667085]">
                                No line items were detected. Add rows to complete the record.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-[14px] bg-[#f6f7fb] px-4 py-3 text-sm">
                      <span className="text-[#667085]">
                        Rows add up to{' '}
                        <b className="font-semibold tabular-nums text-[#151b2c]">
                          {formatMoney(quality.itemTotal, invoice.currency)}
                        </b>
                      </span>
                      <span className={`text-xs font-semibold ${quality.lineItemsMatch ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {quality.lineItemsMatch ? 'Matches subtotal' : 'Differs from subtotal'}
                      </span>
                    </div>
                  </TabsContent>

                  <TabsContent value="raw" className="p-5">
                    <p className="text-xs text-[#667085]">
                      {result?.lines.length ?? 0} lines · colour shows recognition confidence. Click a line to locate it.
                    </p>
                    <ol className="mt-3 max-h-[560px] overflow-auto rounded-[14px] bg-[#111827] p-3 font-mono text-xs leading-6 text-[#dbe4f3]">
                      {result?.lines.map((line, index) => (
                        <li key={index}>
                          <button
                            type="button"
                            onClick={() => {
                              setPage(line.page);
                              setShowBoxes(true);
                            }}
                            className="flex w-full gap-3 rounded px-2 text-left hover:bg-white/5"
                          >
                            <span className={`mt-2.5 size-1.5 shrink-0 rounded-full ${toneFor(line.confidence).dot}`} />
                            <span className="whitespace-pre-wrap break-words">{line.text}</span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </TabsContent>
                </Tabs>

                <div className="border-t border-[#eceff5] bg-[#fafbfd] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-[#5b5ef0]" />
                      <h2 className="text-sm font-semibold">Quality checks</h2>
                      <span className="text-xs text-[#667085]">
                        {quality.passed}/{quality.checks.length} passed
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={!quality.ready}
                      title={quality.ready ? undefined : 'Resolve the failing checks first'}
                      onClick={() => {
                        patchDoc(active.id, { approved: !active.approved });
                        setFeedback(active.approved ? 'Record reopened for review.' : 'Record approved and ready to export.');
                      }}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        active.approved
                          ? 'border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      <Check className="size-3.5" /> {active.approved ? 'Reopen review' : 'Approve record'}
                    </button>
                  </div>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {quality.checks.map((check) => (
                      <li key={check.label} className="flex items-start gap-2.5 rounded-[12px] border border-[#e6e9f0] bg-white p-3">
                        <span
                          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${check.passing ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}
                        >
                          {check.passing ? <Check className="size-3" /> : <AlertCircle className="size-3" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold">{check.label}</span>
                          <span className="mt-0.5 block truncate text-xs text-[#667085]">{check.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value, tone = 'text-[#151b2c]' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-[12px] bg-[#f6f7fb] px-3 py-2">
      <dt className="text-[11px] font-medium text-[#667085]">{label}</dt>
      <dd className={`text-base font-semibold tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}

function FieldBox({
  label,
  confidence,
  missing,
  active,
  highlight,
  onFocus,
  onBlur,
  children,
}: {
  label: string;
  confidence?: number;
  missing?: boolean;
  active?: boolean;
  highlight?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  children: ReactNode;
}) {
  const tone = confidence !== undefined ? toneFor(confidence) : null;
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <label
      onMouseEnter={onFocus}
      onMouseLeave={onBlur}
      onFocus={onFocus}
      onBlur={onBlur}
      className={`block rounded-[14px] border px-3.5 py-2.5 transition focus-within:bg-white ${
        active
          ? 'border-[#5b5ef0] bg-white ring-3 ring-[#5b5ef0]/12'
          : missing
            ? 'border-amber-300 bg-amber-50/40'
            : highlight
              ? 'border-[#5b5ef0]/30 bg-[#f4f4ff]'
              : 'border-[#e2e6ef] bg-[#fafbfd]'
      }`}
    >
      <span className="flex items-center justify-between gap-2 text-xs font-medium text-[#667085]">
        {label}
        {missing ? (
          <span className="text-[11px] font-semibold text-amber-700">Not found</span>
        ) : tone ? (
          <span className={`inline-flex items-center gap-1 text-[11px] ${tone.text}`}>
            <span className={`size-1.5 rounded-full ${tone.dot}`} />
            {confidence}%
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function EmptyState({
  onUpload,
  onSample,
  feedback,
}: {
  onUpload: () => void;
  onSample: (sample: (typeof samples)[number]) => void;
  feedback: string;
}) {
  return (
    <section className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 sm:py-16">
      <div className="text-center">
        <p className="mx-auto w-fit rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-medium text-[#4b4fe0]">
          Workspace
        </p>
        <h1 className="mx-auto mt-4 max-w-[640px] text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[44px]">
          Drop in invoices. Review every value against its source.
        </h1>
        <p className="mx-auto mt-4 max-w-[560px] text-base leading-7 text-[#5d6679]">
          Upload one file or a whole batch. Digital PDFs are read from their text layer; scans and phone photos go
          through OCR with automatic levelling and clean-up.
        </p>
      </div>

      <button
        type="button"
        onClick={onUpload}
        className="group mx-auto mt-10 flex w-full max-w-[760px] flex-col items-center rounded-[28px] border-2 border-dashed border-[#c9cfdd] bg-white px-6 py-12 text-center transition hover:border-[#5b5ef0] hover:shadow-[0_20px_50px_rgba(70,80,190,0.12)]"
      >
        <span className="grid size-14 place-items-center rounded-[18px] bg-[#5b5ef0] text-white shadow-[0_12px_28px_rgba(91,94,240,0.35)] transition group-hover:scale-105">
          <UploadCloud className="size-6" />
        </span>
        <span className="mt-5 text-lg font-semibold">Choose files or drag them anywhere on this page</span>
        <span className="mt-1.5 text-sm text-[#667085]">
          PDF (first {MAX_PAGES} pages), PNG, JPG or WebP · up to 15 MB each · multiple files allowed
        </span>
      </button>

      <div className="mx-auto mt-10 max-w-[760px]">
        <p className="text-sm font-semibold">Or run the real pipeline on a sample</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {samples.map((sample) => (
            <button
              key={sample.file}
              type="button"
              onClick={() => onSample(sample)}
              className="group overflow-hidden rounded-[18px] border border-[#e2e6ef] bg-white text-left transition hover:-translate-y-0.5 hover:border-[#5b5ef0]/50 hover:shadow-[0_14px_34px_rgba(30,40,70,0.1)]"
            >
              <span className="block h-36 overflow-hidden bg-[#eef1f6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sample.thumb} alt="" className="h-full w-full object-cover object-top transition group-hover:scale-[1.03]" />
              </span>
              <span className="flex items-center justify-between gap-2 p-3.5">
                <span>
                  <span className="block text-sm font-semibold">{sample.title}</span>
                  <span className="mt-0.5 block text-xs text-[#667085]">{sample.detail}</span>
                </span>
                <ScanLine className="size-4 shrink-0 text-[#5b5ef0]" />
              </span>
            </button>
          ))}
        </div>
        {feedback && <p className="mt-4 text-sm text-red-700">{feedback}</p>}
        <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-[#667085]">
          <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
          Files never leave this browser tab. The OCR engine and English language data (about 5 MB) download once from a
          public CDN and are cached.
        </p>
      </div>
    </section>
  );
}

function DocumentRail({
  docs,
  activeId,
  onSelect,
  onRemove,
  onUpload,
  onSample,
  onExportBatch,
  readyCount,
}: {
  docs: DocEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onUpload: () => void;
  onSample: (sample: (typeof samples)[number]) => void;
  onExportBatch: () => void;
  readyCount: number;
}) {
  return (
    <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-96px)]">
      <div className="flex min-h-0 flex-col rounded-[20px] border border-[#e2e6ef] bg-white p-3 shadow-[0_6px_24px_rgba(30,40,70,0.05)]">
        <div className="flex items-center justify-between px-1.5 pb-2">
          <p className="text-sm font-semibold">Documents</p>
          <span className="text-xs text-[#667085]">
            {readyCount}/{docs.length} ready
          </span>
        </div>
        <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-y-auto lg:overflow-x-visible">
          {docs.map((doc) => {
            const quality = doc.status === 'ready' ? qualityChecks(doc.invoice) : null;
            const Icon = doc.file.type === 'application/pdf' ? FileText : FileImage;
            return (
              <li key={doc.id} className="min-w-[220px] lg:min-w-0">
                <div
                  className={`group relative rounded-[14px] border p-2.5 transition ${
                    doc.id === activeId ? 'border-[#5b5ef0]/50 bg-[#f4f4ff]' : 'border-transparent hover:bg-[#f6f7fb]'
                  }`}
                >
                  <button type="button" onClick={() => onSelect(doc.id)} className="flex w-full items-start gap-2.5 text-left">
                    <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white text-[#5b5ef0] shadow-sm ring-1 ring-[#e2e6ef]">
                      {doc.status === 'processing' ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1 pr-5">
                      <span className="block truncate text-sm font-medium">{doc.invoice.vendor || doc.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-[#667085]">
                        {doc.status === 'ready'
                          ? `${formatMoney(doc.invoice.total, doc.invoice.currency)} · ${doc.approved ? 'approved' : `${quality?.passed}/4 checks`}`
                          : doc.status === 'error'
                            ? 'Failed'
                            : doc.status === 'queued'
                              ? 'Queued'
                              : doc.progressLabel}
                      </span>
                      {doc.status === 'processing' && (
                        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-[#e4e7f0]">
                          <span className="block h-full rounded-full bg-[#5b5ef0] transition-all" style={{ width: `${doc.progress}%` }} />
                        </span>
                      )}
                    </span>
                  </button>
                  {doc.status !== 'processing' && (
                    <button
                      type="button"
                      aria-label={`Remove ${doc.name}`}
                      onClick={() => onRemove(doc.id)}
                      className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full text-[#98a2b3] opacity-100 transition hover:bg-white hover:text-red-600 lg:opacity-0 lg:group-hover:opacity-100"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                  {doc.status === 'ready' && doc.approved && (
                    <span className="absolute bottom-2.5 right-2.5 grid size-4 place-items-center rounded-full bg-emerald-500 text-white">
                      <Check className="size-2.5" />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 grid gap-2 border-t border-[#eceff5] pt-3">
          <button
            type="button"
            onClick={onUpload}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-dashed border-[#c9cfdd] text-sm font-medium text-[#344054] transition hover:border-[#5b5ef0] hover:text-[#4b4fe0]"
          >
            <Plus className="size-4" /> Add documents
          </button>
          {readyCount > 1 && (
            <button
              type="button"
              onClick={onExportBatch}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-[#eef0ff] text-sm font-medium text-[#4b4fe0] transition hover:bg-[#e2e5ff]"
            >
              <FileSpreadsheet className="size-4" /> Export all {readyCount} as CSV
            </button>
          )}
        </div>
      </div>

      <div className="hidden rounded-[20px] border border-[#e2e6ef] bg-white p-3 lg:block">
        <p className="px-1.5 text-xs font-semibold text-[#667085]">Samples</p>
        <div className="mt-2 grid gap-1">
          {samples.map((sample) => (
            <button
              key={sample.file}
              type="button"
              onClick={() => onSample(sample)}
              className="flex items-center gap-2 rounded-[10px] px-1.5 py-1.5 text-left text-xs transition hover:bg-[#f6f7fb]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sample.thumb} alt="" className="size-8 rounded-md object-cover object-top ring-1 ring-[#e2e6ef]" />
              <span className="min-w-0">
                <span className="block font-medium">{sample.title}</span>
                <span className="block truncate text-[#667085]">{sample.detail}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function SourceViewer({
  doc,
  page,
  onPage,
  focusLine,
  focusLabel,
  showBoxes,
  onToggleBoxes,
  zoom,
  onZoom,
}: {
  doc: DocEntry | null;
  page: number;
  onPage: (page: number) => void;
  focusLine: OcrResult['lines'][number] | undefined;
  focusLabel: string;
  showBoxes: boolean;
  onToggleBoxes: () => void;
  zoom: number;
  onZoom: (zoom: number) => void;
}) {
  const highlightRef = useRef<HTMLDivElement>(null);
  const result = doc?.result;
  const pages = result?.pages ?? [];
  const current = pages[Math.min(page, pages.length - 1)];
  const lines = result?.lines.filter((line) => line.page === page && line.box) ?? [];

  useEffect(() => {
    highlightRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [focusLine]);

  return (
    <section className="min-w-0 overflow-hidden rounded-[20px] border border-[#e2e6ef] bg-white shadow-[0_6px_24px_rgba(30,40,70,0.05)] lg:sticky lg:top-20 lg:max-h-[calc(100vh-96px)] lg:self-start">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eceff5] px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{doc?.name ?? 'Source'}</p>
          <p className="text-xs text-[#667085]">
            {result ? `${lines.length} text lines located on this page` : doc?.status === 'error' ? 'Not processed' : 'Waiting for OCR'}
          </p>
        </div>
        {result && (
          <div className="flex items-center gap-1.5">
            {pages.length > 1 && (
              <div className="flex items-center rounded-full border border-[#e2e6ef]">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={page === 0}
                  onClick={() => onPage(page - 1)}
                  className="grid size-8 place-items-center rounded-full disabled:opacity-35"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="px-1 text-xs tabular-nums">
                  {page + 1}/{pages.length}
                </span>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={page >= pages.length - 1}
                  onClick={() => onPage(page + 1)}
                  className="grid size-8 place-items-center rounded-full disabled:opacity-35"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
            <div className="flex items-center rounded-full border border-[#e2e6ef]">
              <button
                type="button"
                aria-label="Zoom out"
                disabled={zoom <= 1}
                onClick={() => onZoom(Math.max(1, zoom - 0.5))}
                className="grid size-8 place-items-center rounded-full disabled:opacity-35"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-10 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                aria-label="Zoom in"
                disabled={zoom >= 2.5}
                onClick={() => onZoom(Math.min(2.5, zoom + 0.5))}
                className="grid size-8 place-items-center rounded-full disabled:opacity-35"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            <button
              type="button"
              aria-pressed={showBoxes}
              onClick={onToggleBoxes}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition ${
                showBoxes ? 'bg-[#151b2c] text-white' : 'border border-[#e2e6ef] text-[#344054] hover:bg-[#f6f7fb]'
              }`}
            >
              <Layers className="size-3.5" /> Text boxes
            </button>
          </div>
        )}
      </div>

      <div className="max-h-[70vh] overflow-auto bg-[#e9ecf3] p-3 sm:p-5 lg:max-h-[calc(100vh-170px)]">
        {current ? (
          <div className="relative mx-auto bg-white shadow-[0_14px_40px_rgba(20,30,60,0.16)]" style={{ width: `${zoom * 100}%`, maxWidth: zoom === 1 ? 760 : undefined }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.url} alt={`Page ${page + 1} of ${doc?.name}`} className="block h-auto w-full" />
            {showBoxes &&
              lines.map((line, index) => {
                const tone = toneFor(line.confidence);
                return (
                  <div
                    key={index}
                    title={`${line.confidence}% · ${line.text}`}
                    className={`absolute rounded-[2px] border ${tone.ring} ${tone.fill}`}
                    style={{
                      left: `${line.box!.x * 100}%`,
                      top: `${line.box!.y * 100}%`,
                      width: `${line.box!.w * 100}%`,
                      height: `${line.box!.h * 100}%`,
                    }}
                  />
                );
              })}
            {focusLine?.box && focusLine.page === page && (
              <div
                ref={highlightRef}
                className="pointer-events-none absolute rounded-[3px] border-2 border-[#5b5ef0] bg-[#5b5ef0]/15 shadow-[0_0_0_4px_rgba(91,94,240,0.18)] transition-all duration-200"
                style={{
                  left: `calc(${focusLine.box.x * 100}% - 4px)`,
                  top: `calc(${focusLine.box.y * 100}% - 3px)`,
                  width: `calc(${focusLine.box.w * 100}% + 8px)`,
                  height: `calc(${focusLine.box.h * 100}% + 6px)`,
                }}
              >
                <span className="absolute -top-6 left-0 whitespace-nowrap rounded-md bg-[#5b5ef0] px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  {focusLabel} · {focusLine.confidence}%
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="grid min-h-[420px] place-items-center text-center">
            {doc?.status === 'error' ? (
              <div className="max-w-xs">
                <AlertCircle className="mx-auto size-8 text-red-500" />
                <p className="mt-3 text-sm font-semibold">This document could not be read</p>
                <p className="mt-1 text-sm text-[#667085]">{doc.error}</p>
              </div>
            ) : (
              <div className="w-full max-w-xs">
                <ScanLine className="mx-auto size-8 animate-pulse text-[#5b5ef0]" />
                <p className="mt-3 text-sm font-semibold">{doc?.progressLabel ?? 'Waiting'}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[#5b5ef0] transition-all" style={{ width: `${doc?.progress ?? 0}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewPlaceholder({ doc }: { doc: DocEntry | null }) {
  return (
    <div className="grid min-h-[420px] place-items-center p-8 text-center">
      <div className="max-w-sm">
        {doc?.status === 'error' ? (
          <>
            <AlertCircle className="mx-auto size-8 text-red-500" />
            <p className="mt-3 text-base font-semibold">Extraction failed</p>
            <p className="mt-1 text-sm text-[#667085]">{doc.error}</p>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto size-7 animate-spin text-[#5b5ef0]" />
            <p className="mt-3 text-base font-semibold">{doc?.status === 'queued' ? 'Queued' : 'Extracting fields'}</p>
            <p className="mt-1 text-sm text-[#667085]">
              The review form opens as soon as this document has been read. Other files keep processing in order.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
