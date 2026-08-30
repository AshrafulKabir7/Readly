# LumenDoc

LumenDoc is a privacy-first invoice OCR and structured data extraction demo built for a Fiverr portfolio. It turns invoice images and first-page PDFs into editable fields, raw OCR text, and downloadable JSON, CSV, or Excel files.

## What it demonstrates

- SaaS marketing homepage and branded portfolio-demo access flow
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

The login screen is a clearly labeled portfolio-demo gate, not a production identity system. It never transmits or stores the entered password. A buyer implementation can connect the same interface to a production authentication provider.

## Project structure

- `app/` — homepage, login, workspace routes, metadata, and theme
- `components/ocr-workspace.tsx` — document review and export workspace
- `lib/document-ocr.ts` — PDF preparation and OCR pipeline
- `lib/invoice.ts` — invoice schema, parser, and sample data
- `public/` — favicon and social preview
- `docs/` — Fiverr listing copy and demo script
