# LumenDoc

LumenDoc is a privacy-first invoice OCR and structured data extraction demo built for a Fiverr portfolio. It turns invoice images and first-page PDFs into editable fields, raw OCR text, and downloadable JSON, CSV, or Excel files.

## What it demonstrates

- Browser-based OCR with Tesseract.js
- First-page PDF rendering with PDF.js
- Invoice field and line-item parsing
- Editable extraction results
- JSON, CSV, and Excel exports
- Responsive, accessible document-review interface
- Local processing with no document storage

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build
```

## Privacy and limitations

Uploaded files are processed inside the browser. The app does not send or retain documents. The public demo reads one PDF page at a time and uses an English OCR model. Field accuracy depends on image quality and layout; users can review and edit every extracted value before exporting.

## Project structure

- `app/` — interface, metadata, and theme
- `lib/document-ocr.ts` — PDF preparation and OCR pipeline
- `lib/invoice.ts` — invoice schema, parser, and sample data
- `public/` — favicon and social preview
- `docs/` — Fiverr listing copy and demo script
