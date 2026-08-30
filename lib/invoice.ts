export type InvoiceLineItem = {
  description: string;
  quantity: number;
  total: number;
};

export type InvoiceData = {
  vendor: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  lineItems: InvoiceLineItem[];
  confidence: number;
  rawText: string;
  processingMs: number;
};

export const sampleInvoice: InvoiceData = {
  vendor: 'Northstar Office Co.',
  invoiceNumber: 'INV-2026-0842',
  invoiceDate: 'August 24, 2026',
  dueDate: 'September 23, 2026',
  currency: 'USD',
  subtotal: 1032,
  tax: 82.56,
  total: 1114.56,
  lineItems: [
    { description: 'Ergonomic task chair', quantity: 2, total: 698 },
    { description: 'Monitor arm, dual', quantity: 2, total: 218 },
    { description: 'Cable management kit', quantity: 4, total: 116 },
  ],
  confidence: 97.4,
  rawText: `NORTHSTAR OFFICE CO.
INVOICE #INV-2026-0842
Issued August 24, 2026
Due September 23, 2026

Bill to
Acme Creative Studio
82 Market Street
Portland, OR 97205

Ergonomic task chair 2 698.00
Monitor arm, dual 2 218.00
Cable management kit 4 116.00

Subtotal $1,032.00
Tax (8%) $82.56
Total $1,114.56`,
  processingMs: 1820,
};

const amountPattern = /(?:USD|EUR|GBP|BDT|\$|€|£|৳)?\s*([\d,]+(?:\.\d{2})?)/i;

function toAmount(value?: string): number {
  if (!value) return 0;
  const match = value.match(amountPattern);
  return match ? Number(match[1].replaceAll(',', '')) || 0 : 0;
}

function extractAmount(lines: string[], label: RegExp): number {
  const line = [...lines].reverse().find((candidate) => label.test(candidate));
  if (!line) return 0;
  const amounts = [...line.matchAll(/(?:USD|EUR|GBP|BDT|\$|€|£|৳)?\s*([\d,]+(?:\.\d{2})?)/gi)];
  return toAmount(amounts.at(-1)?.[0]);
}

function prettifyDate(value?: string): string {
  if (!value) return '';
  const cleaned = value.trim().replace(/^[\s:.-]+/, '');
  const parsed = new Date(cleaned);
  if (Number.isNaN(parsed.getTime())) return cleaned;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsed);
}

function firstMatch(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function parseLineItems(lines: string[]): InvoiceLineItem[] {
  return lines
    .map((line) =>
      line.match(/^(.{3,}?)\s+(\d{1,3})\s+(?:USD|EUR|GBP|BDT|\$|€|£|৳)?\s*([\d,]+\.\d{2})\s*$/i),
    )
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({
      description: match[1].trim(),
      quantity: Number(match[2]),
      total: toAmount(match[3]),
    }))
    .filter((item) => !/sub\s*total|tax|amount due|grand total|total/i.test(item.description))
    .slice(0, 20);
}

export function parseInvoiceText(
  rawText: string,
  confidence: number,
  processingMs: number,
): InvoiceData {
  const text = rawText.replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const vendor =
    lines.find(
      (line) =>
        /[a-z]{3}/i.test(line) &&
        !/invoice|receipt|bill to|ship to|issued|date|due|subtotal|tax|total|amount/i.test(line) &&
        !/^\d/.test(line),
    ) ?? 'Unknown vendor';

  const datePattern =
    '((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\s+\\d{1,2},?\\s+\\d{4}|\\d{1,4}[\\/-]\\d{1,2}[\\/-]\\d{1,4})';

  const invoiceDate = firstMatch(text, [
    new RegExp(`(?:invoice date|issued|date)\\s*[:#.-]?\\s*${datePattern}`, 'i'),
  ]);
  const dueDate = firstMatch(text, [
    new RegExp(`(?:due date|payment due|due)\\s*[:#.-]?\\s*${datePattern}`, 'i'),
  ]);

  const invoiceNumber = firstMatch(text, [
    /(?:invoice\s*(?:number|no\.?|#)|inv\s*(?:number|no\.?|#))\s*[:#.-]?\s*([A-Z0-9][A-Z0-9/_-]{2,})/i,
    /\b(INV[-_/][A-Z0-9/_-]{3,})\b/i,
  ]);

  const currency = text.includes('€') || /\bEUR\b/i.test(text)
    ? 'EUR'
    : text.includes('£') || /\bGBP\b/i.test(text)
      ? 'GBP'
      : text.includes('৳') || /\bBDT\b/i.test(text)
        ? 'BDT'
        : 'USD';

  return {
    vendor,
    invoiceNumber: invoiceNumber || 'Not detected',
    invoiceDate: prettifyDate(invoiceDate),
    dueDate: prettifyDate(dueDate),
    currency,
    subtotal: extractAmount(lines, /sub\s*total/i),
    tax: extractAmount(lines, /\btax\b|vat/i),
    total: extractAmount(lines, /(?:grand\s+total|amount\s+due|balance\s+due|\btotal\b)/i),
    lineItems: parseLineItems(lines),
    confidence: Math.max(0, Math.min(100, Number(confidence.toFixed(1)))),
    rawText,
    processingMs,
  };
}

export function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value || 0);
  } catch {
    return `${currency} ${(value || 0).toFixed(2)}`;
  }
}
