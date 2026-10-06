import assert from 'node:assert/strict';
import { test } from 'node:test';

import { normalizeDate, parseAmount, parseInvoice } from '../lib/invoice.ts';

// Row text as produced by the OCR row rebuilder for the bundled samples.
const brightwavePhoto = [
  'BRIGHTWAVE DIGITAL LTD   INVOICE',
  '14 Harbour Road, Leeds LS1 4AB   Invoice No: BW-10427',
  'VAT No: GB 123 4567 89   Invoice Date: 03/09/2026',
  'Due Date: 03/10/2026',
  'Bill To',
  'Harper & Lowe Architects',
  '9 King Street',
  'Manchester M2 4WU',
  'Description   Qty   Unit Price   Amount',
  'Website redesign   1   £2,400.00   £2,400.00',
  'Hosting (12 months)   12   £25.00   £300.00',
  'SEO audit   C2   £180.00   £360.00',
  'Subtotal: £3.060.00',
  'VAT (20%): £612.00',
  'Total Due: £3,672.00',
].join('\n');

test('reads a UK photo invoice: vendor, day-first dates, rows and totals', () => {
  const { data, evidence } = parseInvoice(brightwavePhoto, 90, 0);
  assert.equal(data.vendor, 'BRIGHTWAVE DIGITAL LTD');
  assert.equal(data.invoiceNumber, 'BW-10427');
  assert.equal(data.invoiceDate, 'September 3, 2026');
  assert.equal(data.dueDate, 'October 3, 2026');
  assert.equal(data.currency, 'GBP');
  assert.deepEqual([data.subtotal, data.tax, data.total], [3060, 612, 3672]);
  assert.deepEqual(
    data.lineItems.map((item) => [item.description, item.quantity, item.unitPrice, item.total]),
    [
      ['Website redesign', 1, 2400, 2400],
      ['Hosting (12 months)', 12, 25, 300],
      // "C2" is an unreadable quantity cell; it is derived from total / price.
      ['SEO audit', 2, 180, 360],
    ],
  );
  assert.equal(evidence.fields.vendor, 0);
  assert.equal(evidence.fields.total, 14);
  assert.deepEqual(evidence.items, [9, 10, 11]);
});

test('never takes the Bill To customer as the vendor', () => {
  const text = 'INVOICE\nBill To\nAcme Corp\n12 Main Street\nFrom: Blue Fern Studio LLC\nInvoice #: BF-7781\nTotal $750.00';
  assert.equal(parseInvoice(text, 90, 0).data.vendor, 'Blue Fern Studio LLC');
});

test('US invoices keep month-first dates', () => {
  const { data } = parseInvoice('Northwind Office Supply\nInvoice No: NW-1\nInvoice Date: 09/15/2026\nDue Date: 10/01/2026\nTotal $10.00', 99, 0);
  assert.equal(data.invoiceDate, 'September 15, 2026');
  assert.equal(data.dueDate, 'October 1, 2026');
});

test('European amounts and header-less rows that add up to the total', () => {
  const eu = parseInvoice(
    'ACME GmbH\nInvoice Number: 2026-0042\nDate: 15.09.2026\nDescription Qty Price Total\nConsulting 10 120,00 € 1.200,00 €\nSubtotal 1.200,00 €\nVAT 19% 228,00 €\nTotal 1.428,00 €',
    90,
    0,
  ).data;
  assert.equal(eu.currency, 'EUR');
  assert.deepEqual([eu.subtotal, eu.tax, eu.total], [1200, 228, 1428]);
  assert.equal(eu.lineItems[0].total, 1200);

  const loose = parseInvoice('Studio LLC\nInvoice #: A-123\nLogo design $450.00\nBrand guide $300.00\nTotal $750.00', 90, 0).data;
  assert.deepEqual(loose.lineItems.map((item) => item.total), [450, 300]);
  assert.equal(loose.subtotal, 750);
});

test('tax registration numbers are not read as tax amounts', () => {
  const { data } = parseInvoice('Shop Ltd\nVAT No: GB 123 4567 89\nInvoice No: 77-1\nSubtotal £100.00\nVAT (20%) £20.00\nTotal £120.00', 90, 0);
  assert.equal(data.tax, 20);
});

test('amount and date helpers', () => {
  assert.equal(parseAmount('£2.400.00'), 2400);
  assert.equal(parseAmount('1.234,56 €'), 1234.56);
  assert.equal(parseAmount('$1,032'), 1032);
  assert.equal(normalizeDate('31/01/2026', false), 'January 31, 2026');
  assert.equal(normalizeDate('2026-08-01', true), 'August 1, 2026');
  assert.equal(normalizeDate('3rd March 2026', true), 'March 3, 2026');
});
