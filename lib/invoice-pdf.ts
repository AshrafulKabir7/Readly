import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';

import type { InvoiceData } from '@/lib/invoice';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const navy = rgb(0.09, 0.14, 0.25);
const indigo = rgb(0.4, 0.46, 0.96);
const ink = rgb(0.12, 0.16, 0.25);
const muted = rgb(0.42, 0.46, 0.55);
const line = rgb(0.86, 0.88, 0.92);
const soft = rgb(0.96, 0.97, 0.99);
const white = rgb(1, 1, 1);

function safeText(value: string | number | undefined) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7e]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatAmount(value: number, currency: string) {
  try {
    return safeText(
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        currencyDisplay: 'code',
      }).format(value || 0),
    );
  } catch {
    return `${safeText(currency)} ${(value || 0).toFixed(2)}`;
  }
}

function rightAlignedX(
  font: PDFFont,
  text: string,
  size: number,
  rightEdge: number,
) {
  return rightEdge - font.widthOfTextAtSize(text, size);
}

function truncateText(
  font: PDFFont,
  text: string,
  size: number,
  maxWidth: number,
) {
  const clean = safeText(text);
  if (font.widthOfTextAtSize(clean, size) <= maxWidth) return clean;

  let shortened = clean;
  while (
    shortened.length > 1 &&
    font.widthOfTextAtSize(`${shortened}...`, size) > maxWidth
  ) {
    shortened = shortened.slice(0, -1);
  }
  return `${shortened.trimEnd()}...`;
}

function drawTableHeader(page: PDFPage, y: number, bold: PDFFont) {
  page.drawRectangle({ x: 42, y: y - 28, width: 511, height: 28, color: navy });
  const options = { size: 8, font: bold, color: white };
  page.drawText('DESCRIPTION', { x: 52, y: y - 18, ...options });
  page.drawText('QTY', { x: 324, y: y - 18, ...options });
  page.drawText('UNIT PRICE', { x: 378, y: y - 18, ...options });
  page.drawText('TOTAL', { x: 506, y: y - 18, ...options });
  return y - 28;
}

function drawCompactHeader(
  page: PDFPage,
  invoice: InvoiceData,
  regular: PDFFont,
  bold: PDFFont,
) {
  page.drawText(truncateText(bold, invoice.vendor || 'Invoice', 14, 300), {
    x: 42,
    y: 792,
    size: 14,
    font: bold,
    color: ink,
  });
  const continuation = `Invoice ${safeText(invoice.invoiceNumber)} - continued`;
  page.drawText(continuation, {
    x: rightAlignedX(regular, continuation, 9, 553),
    y: 794,
    size: 9,
    font: regular,
    color: muted,
  });
  page.drawLine({
    start: { x: 42, y: 776 },
    end: { x: 553, y: 776 },
    thickness: 1,
    color: line,
  });
}

export async function createInvoicePdf(
  invoice: InvoiceData,
  approved: boolean,
): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  document.setTitle(`Invoice ${safeText(invoice.invoiceNumber)}`);
  document.setAuthor('Readly');
  document.setSubject('Clean digital invoice generated from a source document');
  document.setCreator('Readly');

  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  let page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  page.drawRectangle({
    x: 0,
    y: 704,
    width: PAGE_WIDTH,
    height: 138,
    color: navy,
  });
  page.drawRectangle({ x: 42, y: 792, width: 52, height: 5, color: indigo });
  page.drawText(
    truncateText(bold, invoice.vendor || 'Invoice issuer', 15, 285),
    { x: 42, y: 763, size: 15, font: bold, color: white },
  );
  page.drawText('Clean digital copy', {
    x: 42,
    y: 743,
    size: 9,
    font: regular,
    color: rgb(0.72, 0.76, 0.85),
  });
  page.drawText('INVOICE', {
    x: 403,
    y: 770,
    size: 28,
    font: bold,
    color: white,
  });
  const invoiceNumber = `#${safeText(invoice.invoiceNumber) || 'Not detected'}`;
  page.drawText(invoiceNumber, {
    x: rightAlignedX(regular, invoiceNumber, 10, 553),
    y: 746,
    size: 10,
    font: regular,
    color: rgb(0.72, 0.76, 0.85),
  });

  page.drawRectangle({ x: 42, y: 629, width: 511, height: 52, color: soft });
  const metadata = [
    ['INVOICE DATE', invoice.invoiceDate || 'Not detected', 54],
    ['DUE DATE', invoice.dueDate || 'Not specified', 190],
    ['CURRENCY', invoice.currency || 'USD', 335],
    ['STATUS', approved ? 'Approved' : 'Draft', 448],
  ] as const;
  for (const [label, value, x] of metadata) {
    page.drawText(label, { x, y: 660, size: 7, font: bold, color: muted });
    page.drawText(truncateText(regular, value, 9, 110), {
      x,
      y: 643,
      size: 9,
      font: regular,
      color: ink,
    });
  }

  page.drawText('ITEMS', { x: 42, y: 604, size: 8, font: bold, color: muted });
  let cursorY = drawTableHeader(page, 590, bold);

  for (const [index, item] of invoice.lineItems.entries()) {
    if (cursorY < 185) {
      page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      drawCompactHeader(page, invoice, regular, bold);
      cursorY = drawTableHeader(page, 750, bold);
    }

    cursorY -= 30;
    if (index % 2 === 1) {
      page.drawRectangle({
        x: 42,
        y: cursorY,
        width: 511,
        height: 30,
        color: soft,
      });
    }

    const quantity = Number(item.quantity) || 0;
    const unitPrice =
      Number(item.unitPrice) || (quantity ? item.total / quantity : 0);
    const unitText = formatAmount(unitPrice, invoice.currency);
    const totalText = formatAmount(item.total, invoice.currency);
    page.drawText(truncateText(regular, item.description, 9, 250), {
      x: 52,
      y: cursorY + 10,
      size: 9,
      font: regular,
      color: ink,
    });
    page.drawText(String(quantity), {
      x: 327,
      y: cursorY + 10,
      size: 9,
      font: regular,
      color: ink,
    });
    page.drawText(unitText, {
      x: rightAlignedX(regular, unitText, 9, 458),
      y: cursorY + 10,
      size: 9,
      font: regular,
      color: ink,
    });
    page.drawText(totalText, {
      x: rightAlignedX(bold, totalText, 9, 543),
      y: cursorY + 10,
      size: 9,
      font: bold,
      color: ink,
    });
    page.drawLine({
      start: { x: 42, y: cursorY },
      end: { x: 553, y: cursorY },
      thickness: 0.5,
      color: line,
    });
  }

  if (cursorY < 178) {
    page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawCompactHeader(page, invoice, regular, bold);
    cursorY = 720;
  }

  const summaryTop = cursorY - 28;
  page.drawText('Digitized from the reviewed source document.', {
    x: 42,
    y: summaryTop - 18,
    size: 8,
    font: regular,
    color: muted,
  });
  page.drawText(
    approved
      ? 'All available quality checks passed before export.'
      : 'Draft copy - verify extracted values before accounting use.',
    {
      x: 42,
      y: summaryTop - 34,
      size: 8,
      font: regular,
      color: approved ? rgb(0.08, 0.48, 0.32) : rgb(0.72, 0.42, 0.05),
    },
  );

  page.drawRectangle({
    x: 348,
    y: summaryTop - 104,
    width: 205,
    height: 104,
    color: navy,
  });
  const subtotalText = formatAmount(invoice.subtotal, invoice.currency);
  const taxText = formatAmount(invoice.tax, invoice.currency);
  const totalText = formatAmount(invoice.total, invoice.currency);
  page.drawText('Subtotal', {
    x: 364,
    y: summaryTop - 25,
    size: 8,
    font: regular,
    color: rgb(0.7, 0.74, 0.82),
  });
  page.drawText(subtotalText, {
    x: rightAlignedX(regular, subtotalText, 8, 537),
    y: summaryTop - 25,
    size: 8,
    font: regular,
    color: white,
  });
  page.drawText('Tax', {
    x: 364,
    y: summaryTop - 45,
    size: 8,
    font: regular,
    color: rgb(0.7, 0.74, 0.82),
  });
  page.drawText(taxText, {
    x: rightAlignedX(regular, taxText, 8, 537),
    y: summaryTop - 45,
    size: 8,
    font: regular,
    color: white,
  });
  page.drawLine({
    start: { x: 364, y: summaryTop - 57 },
    end: { x: 537, y: summaryTop - 57 },
    thickness: 0.6,
    color: rgb(0.35, 0.4, 0.52),
  });
  page.drawText('TOTAL', {
    x: 364,
    y: summaryTop - 82,
    size: 9,
    font: bold,
    color: white,
  });
  page.drawText(totalText, {
    x: rightAlignedX(bold, totalText, 13, 537),
    y: summaryTop - 84,
    size: 13,
    font: bold,
    color: white,
  });

  const pages = document.getPages();
  for (const [index, currentPage] of pages.entries()) {
    currentPage.drawLine({
      start: { x: 42, y: 47 },
      end: { x: 553, y: 47 },
      thickness: 0.6,
      color: line,
    });
    currentPage.drawText('Generated by Readly', {
      x: 42,
      y: 29,
      size: 7,
      font: regular,
      color: muted,
    });
    const pageNumber = `Page ${index + 1} of ${pages.length}`;
    currentPage.drawText(pageNumber, {
      x: rightAlignedX(regular, pageNumber, 7, 553),
      y: 29,
      size: 7,
      font: regular,
      color: muted,
    });
  }

  return document.save();
}
