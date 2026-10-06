export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
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

export type EvidenceField =
  | 'vendor'
  | 'invoiceNumber'
  | 'invoiceDate'
  | 'dueDate'
  | 'subtotal'
  | 'tax'
  | 'total';

/**
 * Where each value was read from: indexes into the non-empty, trimmed lines of
 * the raw text. The OCR layer keeps its line boxes in the same order, so an
 * index maps straight back to a region of the source page.
 */
export type InvoiceEvidence = {
  fields: Partial<Record<EvidenceField, number>>;
  items: number[];
};

export type ParsedInvoice = {
  data: InvoiceData;
  evidence: InvoiceEvidence;
};

export const emptyInvoice: InvoiceData = {
  vendor: '',
  invoiceNumber: '',
  invoiceDate: '',
  dueDate: '',
  currency: 'USD',
  subtotal: 0,
  tax: 0,
  total: 0,
  lineItems: [],
  confidence: 0,
  rawText: '',
  processingMs: 0,
};

const MONTH =
  '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const DATE_SOURCE = `(${MONTH}\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}|\\d{1,2}(?:st|nd|rd|th)?\\s+${MONTH}\\.?,?\\s+\\d{4}|\\d{4}[\\/.-]\\d{1,2}[\\/.-]\\d{1,2}|\\d{1,2}[\\/.-]\\d{1,2}[\\/.-]\\d{2,4})`;
const DATE = new RegExp(DATE_SOURCE, 'i');
const CURRENCY_TOKEN = '(?:USD|EUR|GBP|BDT|CAD|AUD|INR|[$€£৳₹])';
const AMOUNT_TOKEN = new RegExp(
  `^${CURRENCY_TOKEN}?\\(?-?${CURRENCY_TOKEN}?\\d[\\d,.]*\\)?$`,
  'i',
);
const AMOUNT_IN_TEXT = new RegExp(
  `${CURRENCY_TOKEN}?\\s?(\\d{1,3}(?:[,.\\s]\\d{3})+(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)(?!\\s?%)(?![\\d/])`,
  'gi',
);
const COMPANY_SUFFIX =
  /\b(ltd|limited|llc|l\.l\.c|inc|incorporated|corp|corporation|co\.?|company|gmbh|plc|pvt|pty|s\.a\.|s\.r\.l|group|studio|supply|supplies|services|solutions|industries|enterprises|traders|trading|partners|agency|labs?)\b/i;
const LABEL_WORDS =
  /\b(invoice\s*(no|number|#|date)|date|due|subtotal|sub-total|tax|vat|gst|total|amount|balance|qty|quantity|description|price|payment|terms|phone|tel|fax|email|e-mail|www\.|account|iban|swift|page \d)\b|@|https?:/i;
const RECIPIENT_START =
  /^(bill(?:ed)?|ship(?:ped)?|sold|deliver(?:ed)?|invoice(?:d)?|remit)\s*to\b|^(customer|client|recipient|buyer)\b/i;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Converts an OCR'd amount to a number. Thousands separators may be commas,
 * dots or spaces ("2.400.00" from a blurry photo, "1.234,56" from a European
 * invoice); the last separator followed by one or two digits is the decimal.
 */
export function parseAmount(raw?: string): number {
  if (!raw) return 0;
  const negative = /^\(.*\)$|^-|\(-/.test(raw.trim());
  let value = raw.replace(/[^\d.,\s]/g, '').trim().replace(/\s+/g, '');
  if (!value) return 0;
  const decimal = value.match(/[.,](\d{1,2})$/);
  if (decimal) {
    const whole = value.slice(0, -decimal[0].length).replace(/[.,]/g, '');
    value = `${whole}.${decimal[1]}`;
  } else {
    value = value.replace(/[.,]/g, '');
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return negative ? -parsed : parsed;
}

function amountsIn(line: string): string[] {
  return [...line.matchAll(AMOUNT_IN_TEXT)].map((match) => match[0]);
}

function monthIndex(name: string): number {
  return [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ].indexOf(name.slice(0, 3).toLowerCase());
}

/**
 * Formats a detected date. Purely numeric dates are ambiguous (03/09/2026 is
 * 3 September in the UK and March 9 in the US), so the order is resolved from
 * the numbers themselves when possible and otherwise from the currency.
 */
export function normalizeDate(raw: string, dayFirst: boolean): string {
  const value = raw.trim().replace(/^[\s:.-]+/, '').replace(/(\d)(st|nd|rd|th)/i, '$1');
  let year = 0;
  let month = -1;
  let day = 0;

  const iso = value.match(/^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/);
  const numeric = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  const monthFirst = value.match(new RegExp(`^(${MONTH})\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})$`, 'i'));
  const dayFirstText = value.match(new RegExp(`^(\\d{1,2})\\s+(${MONTH})\\.?,?\\s+(\\d{4})$`, 'i'));

  if (iso) {
    [year, month, day] = [Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])];
  } else if (numeric) {
    const a = Number(numeric[1]);
    const b = Number(numeric[2]);
    year = Number(numeric[3]);
    if (year < 100) year += 2000;
    const useDayFirst = a > 12 ? true : b > 12 ? false : dayFirst;
    [day, month] = useDayFirst ? [a, b - 1] : [b, a - 1];
  } else if (monthFirst) {
    [month, day, year] = [monthIndex(monthFirst[1]), Number(monthFirst[2]), Number(monthFirst[3])];
  } else if (dayFirstText) {
    [day, month, year] = [Number(dayFirstText[1]), monthIndex(dayFirstText[2]), Number(dayFirstText[3])];
  }

  if (month < 0 || month > 11 || day < 1 || day > 31 || year < 1900) return value;
  const date = new Date(Date.UTC(year, month, day));
  if (date.getUTCMonth() !== month) return value;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function detectCurrency(text: string): string {
  const counts: Array<[string, number]> = [
    ['EUR', (text.match(/€|\bEUR\b/g) ?? []).length],
    ['GBP', (text.match(/£|\bGBP\b/g) ?? []).length],
    ['BDT', (text.match(/৳|\bBDT\b|\bTk\.?\s?\d/g) ?? []).length],
    ['INR', (text.match(/₹|\bINR\b|\bRs\.?\s?\d/g) ?? []).length],
    ['CAD', (text.match(/\bCAD\b|C\$/g) ?? []).length],
    ['AUD', (text.match(/\bAUD\b|A\$/g) ?? []).length],
    ['USD', (text.match(/\$|\bUSD\b/g) ?? []).length],
  ];
  const best = counts.sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : 'USD';
}

function findDate(
  lines: string[],
  labels: RegExp,
  exclude?: RegExp,
): { value: string; index: number } | null {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!labels.test(line) || (exclude && exclude.test(line))) continue;
    const afterLabel = line.slice(line.search(labels));
    const inLine = afterLabel.match(DATE);
    if (inLine) return { value: inLine[1], index };
    // Label and value in separate columns: the value is usually the next line.
    const next = lines[index + 1];
    const below = next?.match(new RegExp(`^${DATE_SOURCE}`, 'i'));
    if (below) return { value: below[1], index: index + 1 };
  }
  return null;
}

function findAmount(
  lines: string[],
  label: RegExp,
  exclude?: RegExp,
): { value: number; index: number } | null {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (!label.test(line) || (exclude && exclude.test(line))) continue;
    const afterLabel = line.slice(line.search(label));
    const amounts = amountsIn(afterLabel.replace(/\(\s*\d+(?:\.\d+)?\s*%\s*\)/g, ''));
    if (amounts.length) return { value: parseAmount(amounts.at(-1)), index };
    const next = lines[index + 1];
    if (next && /^[^a-z]*\d[\d,.\s]*$/i.test(next)) {
      return { value: parseAmount(next), index: index + 1 };
    }
  }
  return null;
}

function recipientLines(lines: string[]): Set<number> {
  const blocked = new Set<number>();
  lines.forEach((line, index) => {
    if (!RECIPIENT_START.test(line)) return;
    blocked.add(index);
    // An inline "Bill to: Name" keeps the name on the same line.
    for (let offset = 1; offset <= 4; offset += 1) {
      const next = lines[index + offset];
      if (!next || LABEL_WORDS.test(next) || /^(invoice|receipt)$|^(from|vendor|supplier|seller|issued by)\b/i.test(next)) break;
      blocked.add(index + offset);
    }
  });
  return blocked;
}

function cleanVendor(line: string): string {
  return line
    .replace(/\b(tax\s+)?(invoice|receipt|quotation|statement|bill)\b(\s*[/|-]\s*\b(invoice|receipt)\b)?/gi, ' ')
    .replace(/^(from|vendor|supplier|seller|issued by)\s*[:-]?\s*/i, '')
    .replace(/[|_]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[^a-z0-9]+|[^a-z0-9.)&]+$/gi, '')
    .trim();
}

function findVendor(lines: string[], itemLines: Set<number>): { value: string; index: number } | null {
  const blocked = recipientLines(lines);
  let best: { value: string; index: number; score: number } | null = null;

  lines.slice(0, 18).forEach((line, index) => {
    if (blocked.has(index) || itemLines.has(index)) return;
    const labelled = /^(from|vendor|supplier|seller|issued by)\b/i.test(line);
    const value = cleanVendor(line);
    if (!/[a-z]{3}/i.test(value) || value.length > 60) return;
    if (!labelled && (LABEL_WORDS.test(value) || DATE.test(value))) return;
    if (/^\d/.test(value) || /\b\d{3,}\b/.test(value) && !COMPANY_SUFFIX.test(value)) return;
    if (/\b(street|st\.|road|rd\.|avenue|ave|lane|suite|floor|blvd|drive|po box)\b/i.test(value)) return;
    if (/\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/.test(value)) return; // UK postcode line

    const letters = value.replace(/[^a-z]/gi, '');
    const upperRatio = letters.replace(/[^A-Z]/g, '').length / Math.max(1, letters.length);
    let score = 12 - index * 0.7;
    if (COMPANY_SUFFIX.test(value)) score += 6;
    if (labelled || /^from\b/i.test(lines[index - 1] ?? '')) score += 8;
    if (upperRatio > 0.7) score += 2;
    if (value.split(/\s+/).length > 7) score -= 4;
    if (/thank|regards|signature|page/i.test(value)) score -= 10;
    if (!best || score > best.score) best = { value, index, score };
  });

  return best ? { value: (best as { value: string }).value, index: (best as { index: number }).index } : null;
}

type ItemMatch = { item: InvoiceLineItem; index: number };

function parseItemLine(line: string, insideTable: boolean): InvoiceLineItem | null {
  const tokens = line
    .replace(/[|[\]{}]/g, ' ')
    .replace(/(\d)\s+([.,]\d{2})\b/g, '$1$2')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const numbers: string[] = [];
  while (tokens.length && numbers.length < 3) {
    const token = tokens.at(-1)!;
    if (AMOUNT_TOKEN.test(token) && /\d/.test(token)) {
      numbers.unshift(tokens.pop()!);
    } else if (/^(USD|EUR|GBP|BDT|CAD|AUD|INR|[$€£৳₹])$/i.test(token)) {
      tokens.pop();
    } else {
      break;
    }
  }

  // A one or two character token next to the amounts is usually an unreadable
  // quantity cell ("IE" for "1"), not part of the description.
  let quantityLost = false;
  if (tokens.length > 1 && numbers.length === 2 && /^[^\s]{1,2}$/.test(tokens.at(-1)!) && !/^(x|ea|pc|hr|kg|m2)$/i.test(tokens.at(-1)!)) {
    tokens.pop();
    quantityLost = true;
  }

  const description = tokens.join(' ').replace(/^[^a-z0-9(]+/i, '').trim();
  if (!/[a-z]{2}/i.test(description) || description.length < 3) return null;
  if (/\b(sub\s*-?\s*total|total|tax|vat|gst|discount|balance|amount due|payment|invoice|date|phone|tel|no:|number|account|iban|page)\b/i.test(description)) return null;
  if (!numbers.length) return null;

  const values = numbers.map(parseAmount);
  const isInteger = (token: string, value: number) => /^\d{1,4}$/.test(token) && value > 0;

  if (values.length === 3) {
    const [quantity, unitPrice, total] = values;
    if (quantity <= 0 || total <= 0) return null;
    if (Math.abs(quantity * unitPrice - total) <= Math.max(0.02, total * 0.01)) {
      return { description, quantity, unitPrice, total };
    }
    const derived = unitPrice > 0 ? total / unitPrice : 0;
    if (derived >= 1 && Math.abs(derived - Math.round(derived)) < 0.01) {
      return { description, quantity: Math.round(derived), unitPrice, total };
    }
    return null;
  }

  if (values.length === 2) {
    const [first, total] = values;
    if (total <= 0) return null;
    if (!quantityLost && isInteger(numbers[0], first) && !/[$€£৳₹]/.test(numbers[0]) && first < total) {
      return { description, quantity: first, unitPrice: round2(total / first), total };
    }
    const ratio = first > 0 ? total / first : 0;
    if (ratio >= 1 && Math.abs(ratio - Math.round(ratio)) < 0.01) {
      return { description, quantity: Math.round(ratio), unitPrice: first, total };
    }
    return insideTable ? { description, quantity: 1, unitPrice: total, total } : null;
  }

  if (insideTable && /[.,]\d{2}$|[$€£৳₹]/.test(numbers[0])) {
    const total = values[0];
    return total > 0 ? { description, quantity: 1, unitPrice: total, total } : null;
  }
  return null;
}

function parseLineItems(lines: string[]): ItemMatch[] {
  const headerIndex = lines.findIndex(
    (line) =>
      /\b(item|description|product|service|details|particulars)\b/i.test(line) &&
      /\b(qty|quantity|amount|price|rate|total|hours|units?)\b/i.test(line),
  );
  const totalsIndex = lines.findIndex(
    (line, index) =>
      index > headerIndex && /\b(sub\s*-?\s*total|total|tax|vat|balance)\b/i.test(line),
  );
  const start = headerIndex >= 0 ? headerIndex + 1 : 0;
  const end = headerIndex >= 0 && totalsIndex > headerIndex ? totalsIndex : lines.length;

  const matches: ItemMatch[] = [];
  for (let index = start; index < end && matches.length < 40; index += 1) {
    const item = parseItemLine(lines[index], headerIndex >= 0);
    if (item) matches.push({ item: { ...item, total: round2(item.total), unitPrice: round2(item.unitPrice) }, index });
  }
  if (matches.length || headerIndex >= 0) return matches;

  // No table header: accept "Description  $amount" rows only when, together,
  // they add up to a subtotal or total printed further down.
  const firstTotal = lines.findIndex((line) => /\b(sub\s*-?\s*total|total)\b/i.test(line));
  if (firstTotal <= 0) return matches;
  const loose: ItemMatch[] = [];
  for (let index = 0; index < firstTotal; index += 1) {
    const item = parseItemLine(lines[index], true);
    if (item && /[$€£৳₹]|\d[.,]\d{2}\b/.test(lines[index])) loose.push({ item, index });
  }
  const sum = round2(loose.reduce((total, match) => total + match.item.total, 0));
  const printed = lines.slice(firstTotal).flatMap((line) => amountsIn(line).map(parseAmount));
  return loose.length && printed.some((value) => Math.abs(value - sum) < 0.02) ? loose : matches;
}

export function parseInvoice(
  rawText: string,
  confidence: number,
  processingMs: number,
): ParsedInvoice {
  const lines = rawText
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/\t/g, ' ').replace(/ {2,}/g, '  ').trim())
    .filter(Boolean);
  const flat = lines.map((line) => line.replace(/\s+/g, ' '));
  const text = flat.join('\n');

  const currency = detectCurrency(text);
  const dayFirst = !['USD', 'CAD'].includes(currency);

  const items = parseLineItems(lines);
  const itemLines = new Set(items.map((match) => match.index));
  const vendor = findVendor(flat, itemLines);

  const invoiceDate =
    findDate(flat, /\b(invoice\s*date|date\s*of\s*issue|issue\s*date|issued(?:\s+on)?|bill\s*date|dated)\b/i) ??
    findDate(flat, /\bdate\b/i, /\b(due|payment|delivery|ship|order|expir|valid)\b/i);
  const dueDate = findDate(flat, /\b(due\s*date|payment\s*due|due\s*by|due\s*on|pay\s*by|due)\b/i);

  let invoiceNumberIndex = -1;
  let invoiceNumber = '';
  const numberPattern =
    /\b(?:invoice|inv|bill|receipt|reference|ref)\.?\s*(?:number|no\.?|num|#|id)?\s*[:#.]?\s*#?\s*([A-Z0-9][A-Z0-9/_.-]{2,})/i;
  for (let index = 0; index < flat.length; index += 1) {
    const match = flat[index].match(numberPattern);
    if (match && /\d/.test(match[1]) && !DATE.test(match[1])) {
      invoiceNumber = match[1].replace(/[.,:;]$/, '');
      invoiceNumberIndex = index;
      break;
    }
  }
  if (!invoiceNumber) {
    const fallback = /\b(INV[-_/#]?\s?\d[A-Z0-9/_-]{2,})\b/i;
    const index = flat.findIndex((line) => fallback.test(line));
    if (index >= 0) {
      invoiceNumber = flat[index].match(fallback)![1].replace(/\s/g, '');
      invoiceNumberIndex = index;
    }
  }

  const subtotal = findAmount(flat, /\bsub\s*-?\s*total\b|\bnet\s+(amount|total)\b/i);
  const tax = findAmount(
    flat,
    /\b(sales\s+)?(tax|vat|gst|hst)\b/i,
    /\b(no|number|id|reg|registration|#)\b\.?\s*[:#]?\s*[A-Z]{0,2}\s*\d|tax\s*id|vat\s*no|incl/i,
  );
  const total =
    findAmount(flat, /\b(grand\s+total|total\s+due|amount\s+due|balance\s+due|total\s+payable|amount\s+payable)\b/i) ??
    findAmount(flat, /(?<!sub\s?-?\s?)\btotal\b/i, /\bsub\s*-?\s*total\b|total\s+(tax|vat|items?|qty|quantity)/i);

  let subtotalValue = subtotal?.value ?? 0;
  let totalValue = total?.value ?? 0;
  const taxValue = tax?.value ?? 0;
  const itemSum = round2(items.reduce((sum, match) => sum + match.item.total, 0));

  // Fill a figure the OCR missed from the other two instead of reporting 0.
  if (!subtotalValue && itemSum > 0 && (!totalValue || Math.abs(itemSum + taxValue - totalValue) < 0.02)) {
    subtotalValue = itemSum;
  }
  if (!totalValue && subtotalValue) totalValue = round2(subtotalValue + taxValue);
  if (!subtotalValue && totalValue && taxValue && totalValue >= taxValue) {
    subtotalValue = round2(totalValue - taxValue);
  }

  const evidence: InvoiceEvidence = { fields: {}, items: items.map((match) => match.index) };
  if (vendor) evidence.fields.vendor = vendor.index;
  if (invoiceNumberIndex >= 0) evidence.fields.invoiceNumber = invoiceNumberIndex;
  if (invoiceDate) evidence.fields.invoiceDate = invoiceDate.index;
  if (dueDate) evidence.fields.dueDate = dueDate.index;
  if (subtotal) evidence.fields.subtotal = subtotal.index;
  if (tax) evidence.fields.tax = tax.index;
  if (total) evidence.fields.total = total.index;

  return {
    data: {
      vendor: vendor?.value ?? '',
      invoiceNumber,
      invoiceDate: invoiceDate ? normalizeDate(invoiceDate.value, dayFirst) : '',
      dueDate: dueDate ? normalizeDate(dueDate.value, dayFirst) : '',
      currency,
      subtotal: round2(subtotalValue),
      tax: round2(taxValue),
      total: round2(totalValue),
      lineItems: items.map((match) => match.item),
      confidence: Math.max(0, Math.min(100, Number(confidence.toFixed(1)))),
      rawText,
      processingMs,
    },
    evidence,
  };
}

/** Kept for callers that only need the record. */
export function parseInvoiceText(
  rawText: string,
  confidence: number,
  processingMs: number,
): InvoiceData {
  return parseInvoice(rawText, confidence, processingMs).data;
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
