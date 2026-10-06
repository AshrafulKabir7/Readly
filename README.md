# Readly

Readly is a privacy-first invoice OCR and data-extraction demo built for a Fiverr portfolio. It reads digital PDFs, scans and phone photos, turns them into an editable invoice record, and shows where on the page every value was found.

## What it demonstrates

- Marketing homepage with a live product visual and a before/after view of the image clean-up
- Portfolio-demo access screen (clearly labelled, nothing transmitted)
- Workspace with a batch queue: drop several invoices, they are processed one after another
- Three bundled samples (digital PDF, skewed phone photo, monospace receipt) that run through the real pipeline
- Source evidence: hover or focus a field and its line is outlined on the page, with recognition confidence
- "Text boxes" overlay that colours every recognised line by confidence
- Four quality checks (identity, dates, line items vs subtotal, subtotal + tax vs total) gating approval
- Exports: JSON, CSV, Excel, a typed PDF copy, and one combined CSV for the whole batch

## How extraction works

1. **PDF text layer.** Digital PDFs (first 3 pages) are read directly with PDF.js, so their values are exact. Scanned PDFs without a text layer fall through to OCR.
2. **OCR pass 1.** Tesseract.js (English, LSTM, page segmentation mode 4) reads the page in a persistent worker.
3. **OCR pass 2 (only when needed).** If the first reading is incomplete or does not balance, the page is cleaned and read again (`lib/image-enhance.ts`):
   - deskew by maximising the variance of text-row ink sums (ink found by local contrast, so a dark desk around the page does not skew the estimate),
   - upscale to about 300 dpi,
   - adaptive Sauvola thresholding to flatten shadows,
   - removal of long horizontal and vertical rules, because table borders make OCR drop rows.
   The more complete, more consistent reading wins (`scoreExtraction` weights each field by the confidence of the line it came from).
4. **Row rebuilding.** Words are regrouped by baseline into visual rows, with wide gaps kept as column separators, so a table row keeps its description, quantity, price and total together even when Tesseract reads the table column by column.
5. **Parsing** (`lib/invoice.ts`). Vendor (never the Bill To / Ship To customer), invoice number, issue and due dates (day-first for GBP/EUR and other non-US currencies, unless the numbers make the order obvious), currency, totals (tax registration numbers are ignored), and line items. Unreadable quantity cells are recovered from total ÷ unit price. Each value keeps the index of its source line.

Verified on the bundled samples: all three pass 4/4 checks, including the 2.5° skewed photo with a bordered table.

## Run locally

Requirements: Node.js 22.13 or newer (22.11 also builds).

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # parser unit tests (node:test)
npm run typecheck
npm run build
```

## Privacy and limitations

Documents are processed inside the browser tab and never uploaded. The OCR engine and its English language data (about 5 MB) download once from a public CDN. Accuracy depends on image quality: very low resolution, heavy creases, unusual layouts and handwriting are harder, which is why every value shows its source and confidence and the checks must pass before approval.

The login screen is a portfolio-demo gate, not a production identity system. It never transmits or stores the entered password.

## Project structure

- `app/` — homepage, login, workspace routes, metadata and theme
- `components/ocr-workspace.tsx` — queue, source viewer with evidence overlay, review form, exports
- `components/hero-visual.tsx`, `components/clean-compare.tsx` — homepage visuals built from the real sample output
- `lib/document-ocr.ts` — PDF text layer, OCR passes, row rebuilding, scoring
- `lib/image-enhance.ts` — deskew, thresholding, table-rule removal
- `lib/invoice.ts` — invoice schema and parser
- `lib/invoice-pdf.ts` — typed PDF export
- `public/samples/` — fictional sample invoices
- `tests/` — parser tests
- `docs/` — Fiverr listing copy and demo script
