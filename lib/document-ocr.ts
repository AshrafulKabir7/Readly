import type { Bbox, Worker as TesseractWorker } from 'tesseract.js';

import { enhanceDocument, mapBoxToSource } from '@/lib/image-enhance';
import { parseInvoice, type ParsedInvoice } from '@/lib/invoice';

export type OcrProgress = {
  label: string;
  value: number;
};

/** A region of a page, as fractions of the page width and height. */
export type SourceBox = { x: number; y: number; w: number; h: number };

export type OcrLine = {
  text: string;
  confidence: number;
  page: number;
  box: SourceBox | null;
};

export type DocumentPage = {
  url: string;
  width: number;
  height: number;
};

export type ExtractionMethod = 'pdf-text' | 'ocr' | 'ocr-enhanced';

export type OcrResult = ParsedInvoice & {
  lines: OcrLine[];
  pages: DocumentPage[];
  /** Pages in the source file; only the first MAX_PAGES are read. */
  pageCount: number;
  method: ExtractionMethod;
  /** Degrees the enhanced pass rotated the page to level it. */
  skewAngle: number;
  passes: number;
};

const MAX_FILE_SIZE = 15 * 1024 * 1024;
export const MAX_PAGES = 3;
const acceptedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

type PageSource = {
  canvas: HTMLCanvasElement;
  page: DocumentPage;
  /** Lines from a PDF's embedded text layer, when it has one. */
  nativeLines: OcrLine[] | null;
};

type PassLine = Omit<OcrLine, 'page'>;

let workerPromise: Promise<TesseractWorker> | null = null;
let reportRecognition: ((progress: number) => void) | null = null;

function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker, PSM } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (message) => {
          if (message.status === 'recognizing text') {
            reportRecognition?.(message.progress ?? 0);
          }
        },
      });
      // PSM 4 (one column of variable-size text) keeps table rows on one line
      // and reads both clean exports and phone photos better than the default.
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_COLUMN,
        preserve_interword_spaces: '1',
      });
      return worker;
    })().catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

function toCanvas(source: HTMLImageElement | ImageBitmap | HTMLCanvasElement, maxSide = 3000, minSide = 1600) {
  const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  const longSide = Math.max(width, height);
  const scale = longSide > maxSide ? maxSide / longSide : longSide < minSide ? minSide / longSide : 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser could not prepare the image.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function loadImage(file: File): Promise<PageSource[]> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error('This image could not be opened. Try a PNG or JPG export.');
  }
  return [
    {
      canvas: toCanvas(image),
      page: { url, width: image.naturalWidth, height: image.naturalHeight },
      nativeLines: null,
    },
  ];
}

type PdfTextItem = { str: string; transform: number[]; width: number; height: number };

/**
 * Rebuilds reading-order lines from a PDF text layer. Items are grouped by
 * baseline, sorted left to right, and wide gaps become a double space so the
 * table columns survive the same way they do in OCR output.
 */
function linesFromTextLayer(
  items: PdfTextItem[],
  viewport: { width: number; height: number; transform: number[] },
  multiply: (a: number[], b: number[]) => number[],
  page: number,
): OcrLine[] {
  const glyphs = items
    .filter((item) => item.str.trim())
    .map((item) => {
      const matrix = multiply(viewport.transform, item.transform);
      const size = Math.hypot(matrix[2], matrix[3]) || 10;
      const x0 = matrix[4];
      const baseline = matrix[5];
      const scale = Math.hypot(viewport.transform[0], viewport.transform[1]) || 1;
      return { text: item.str, x0, x1: x0 + item.width * scale, baseline, size };
    })
    .sort((a, b) => a.baseline - b.baseline || a.x0 - b.x0);

  const rows: (typeof glyphs)[] = [];
  for (const glyph of glyphs) {
    const row = rows.find((candidate) => Math.abs(candidate[0].baseline - glyph.baseline) < glyph.size * 0.45);
    if (row) row.push(glyph);
    else rows.push([glyph]);
  }

  return rows
    .map((row) => {
      row.sort((a, b) => a.x0 - b.x0);
      let text = '';
      row.forEach((glyph, index) => {
        if (index > 0) {
          const gap = glyph.x0 - row[index - 1].x1;
          text += gap > glyph.size * 1.2 ? '   ' : gap > glyph.size * 0.12 && !/\s$/.test(text) ? ' ' : '';
        }
        text += glyph.text;
      });
      const size = Math.max(...row.map((glyph) => glyph.size));
      const x0 = Math.min(...row.map((glyph) => glyph.x0));
      const x1 = Math.max(...row.map((glyph) => glyph.x1));
      const baseline = row[0].baseline;
      return {
        text: text.trim(),
        confidence: 100,
        page,
        box: {
          x: x0 / viewport.width,
          y: (baseline - size * 0.9) / viewport.height,
          w: (x1 - x0) / viewport.width,
          h: (size * 1.2) / viewport.height,
        },
      };
    })
    .filter((line) => line.text);
}

async function loadPdf(file: File, onProgress: (progress: OcrProgress) => void) {
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const sources: PageSource[] = [];
  const pagesToRead = Math.min(pdf.numPages, MAX_PAGES);

  for (let number = 1; number <= pagesToRead; number += 1) {
    onProgress({ label: `Rendering page ${number} of ${pagesToRead}`, value: 6 + number * 3 });
    const page = await pdf.getPage(number);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not prepare the PDF.');
    await page.render({ canvas, canvasContext: context, viewport }).promise;

    const content = await page.getTextContent();
    const nativeLines = linesFromTextLayer(
      content.items.filter((item) => 'str' in item) as PdfTextItem[],
      viewport,
      (a, b) => pdfjs.Util.transform(a, b),
      sources.length,
    );
    const characters = nativeLines.reduce((sum, line) => sum + line.text.length, 0);

    sources.push({
      canvas,
      page: {
        url: canvas.toDataURL('image/jpeg', 0.9),
        width: canvas.width,
        height: canvas.height,
      },
      // Scanned PDFs carry no text layer (or a few stray characters).
      nativeLines: characters >= 40 ? nativeLines : null,
    });
  }

  return { sources, pageCount: pdf.numPages };
}

type Word = { text: string; confidence: number; x0: number; y0: number; x1: number; y1: number };

const RULE_FRAGMENT = /^[|[\]{}=_~.,:;'"`°‘’“”—–-]+$/;

/**
 * Rebuilds visual rows from word boxes. Tesseract sometimes reads a table
 * column by column, which separates each description from its amounts;
 * grouping words that share a baseline restores "Item  Qty  Price  Total" rows.
 * Wide horizontal gaps are kept as a triple space so columns stay detectable.
 */
export function wordsToRows(words: Word[]) {
  const clean = words.filter(
    (word) => word.text && !RULE_FRAGMENT.test(word.text) && !(word.text.length === 1 && word.confidence < 45),
  );
  if (!clean.length) return [];
  const heights = clean.map((word) => word.y1 - word.y0).sort((a, b) => a - b);
  const typical = heights[Math.floor(heights.length / 2)] || 10;

  const rows: { words: Word[]; center: number; height: number }[] = [];
  for (const word of [...clean].sort((a, b) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2)) {
    const center = (word.y0 + word.y1) / 2;
    const height = Math.min(word.y1 - word.y0, typical * 2);
    const row = rows.find((candidate) => Math.abs(candidate.center - center) < Math.max(candidate.height, height) * 0.5);
    if (row) {
      row.words.push(word);
      row.center = (row.center * (row.words.length - 1) + center) / row.words.length;
      row.height = Math.max(row.height, height);
    } else {
      rows.push({ words: [word], center, height });
    }
  }

  return rows
    .sort((a, b) => a.center - b.center)
    .map((row) => {
      row.words.sort((a, b) => a.x0 - b.x0);
      let text = '';
      row.words.forEach((word, index) => {
        if (index > 0) text += word.x0 - row.words[index - 1].x1 > typical * 1.4 ? '   ' : ' ';
        text += word.text;
      });
      const characters = row.words.reduce((sum, word) => sum + word.text.length, 0);
      return {
        text,
        confidence: Math.round(
          row.words.reduce((sum, word) => sum + word.confidence * word.text.length, 0) / Math.max(1, characters),
        ),
        box: {
          x0: Math.min(...row.words.map((word) => word.x0)),
          y0: Math.min(...row.words.map((word) => word.y0)),
          x1: Math.max(...row.words.map((word) => word.x1)),
          y1: Math.max(...row.words.map((word) => word.y1)),
        },
      };
    });
}

async function recognizeCanvas(
  canvas: HTMLCanvasElement,
  mapBox: (box: Bbox) => Bbox,
  sourceWidth: number,
  sourceHeight: number,
): Promise<{ lines: PassLine[]; confidence: number }> {
  const worker = await getWorker();
  const { data } = await worker.recognize(canvas, {}, { text: true, blocks: true });
  const words: Word[] = [];
  for (const block of data.blocks ?? []) {
    for (const paragraph of block.paragraphs) {
      for (const line of paragraph.lines) {
        for (const word of line.words) {
          words.push({ text: word.text.trim(), confidence: word.confidence, ...word.bbox });
        }
      }
    }
  }
  const lines = wordsToRows(words).map<PassLine>((row) => {
    const box = mapBox(row.box);
    return {
      text: row.text,
      confidence: row.confidence,
      box: {
        x: Math.max(0, box.x0 / sourceWidth),
        y: Math.max(0, box.y0 / sourceHeight),
        w: (box.x1 - box.x0) / sourceWidth,
        h: (box.y1 - box.y0) / sourceHeight,
      },
    };
  });
  return { lines, confidence: data.confidence };
}

/**
 * How complete and internally consistent an extraction is. Each found field
 * counts by the confidence of the line it was read from, so a value pulled out
 * of a garbled line scores lower than the same field read cleanly.
 */
export function scoreExtraction(
  { data, evidence }: ParsedInvoice,
  lines: Pick<OcrLine, 'confidence'>[],
): { score: number; complete: boolean } {
  const read = (field: keyof ParsedInvoice['evidence']['fields'], weight = 1) => {
    const index = evidence.fields[field];
    if (index === undefined) return 0;
    return weight * Math.min(1, (lines[index]?.confidence ?? 50) / 90);
  };
  const itemSum = data.lineItems.reduce((sum, item) => sum + item.total, 0);
  const itemsMatch = data.lineItems.length > 0 && Math.abs(itemSum - data.subtotal) < 0.02;
  const balanced = data.total > 0 && Math.abs(data.subtotal + data.tax - data.total) < 0.02;
  const weakFields = Object.values(evidence.fields).filter(
    (index) => index !== undefined && (lines[index]?.confidence ?? 100) < 60,
  ).length;
  let score = data.confidence / 100;
  score += read('vendor') + read('invoiceNumber') + read('invoiceDate') + read('dueDate', 0.5) + read('total');
  if (data.lineItems.length) score += 1;
  if (itemsMatch) score += 2;
  if (balanced) score += 2;
  return {
    score,
    complete:
      itemsMatch &&
      balanced &&
      weakFields === 0 &&
      Boolean(data.vendor && data.invoiceNumber && data.invoiceDate),
  };
}

function combine(lines: OcrLine[], confidence: number, startedAt: number) {
  const rawText = lines.map((line) => line.text).join('\n');
  return parseInvoice(rawText, confidence, performance.now() - startedAt);
}

export async function processDocument(
  file: File,
  onProgress: (progress: OcrProgress) => void,
): Promise<OcrResult> {
  if (!acceptedTypes.includes(file.type)) {
    throw new Error('Please upload a PDF, PNG, JPG or WebP document.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('This file is larger than 15 MB.');
  }

  const startedAt = performance.now();
  onProgress({ label: 'Preparing document', value: 5 });

  const { sources, pageCount } =
    file.type === 'application/pdf'
      ? await loadPdf(file, onProgress)
      : { sources: await loadImage(file), pageCount: 1 };

  const needsOcr = sources.filter((source) => !source.nativeLines);
  if (!needsOcr.length) {
    onProgress({ label: 'Reading the PDF text layer', value: 90 });
    const lines = sources.flatMap((source) => source.nativeLines ?? []);
    const parsed = combine(lines, 100, startedAt);
    onProgress({ label: 'Ready to review', value: 100 });
    return {
      ...parsed,
      lines,
      pages: sources.map((source) => source.page),
      pageCount,
      method: 'pdf-text',
      skewAngle: 0,
      passes: 0,
    };
  }

  onProgress({ label: 'Loading the OCR engine', value: 14 });
  await getWorker();

  const runPass = async (enhanced: boolean, from: number, to: number) => {
    const lines: OcrLine[] = [];
    const confidences: number[] = [];
    let skewAngle = 0;
    for (let index = 0; index < sources.length; index += 1) {
      const source = sources[index];
      if (source.nativeLines) {
        lines.push(...source.nativeLines);
        continue;
      }
      const span = (to - from) / needsOcr.length;
      const start = from + span * needsOcr.indexOf(source);
      const label = enhanced ? 'Enhancing and re-reading' : 'Reading text and amounts';
      reportRecognition = (progress) =>
        onProgress({
          label: sources.length > 1 ? `${label} · page ${index + 1}` : label,
          value: Math.round(start + span * progress),
        });

      let result;
      if (enhanced) {
        onProgress({ label: 'Levelling and cleaning the image', value: Math.round(start) });
        const prepared = enhanceDocument(source.canvas);
        skewAngle = prepared.angle;
        result = await recognizeCanvas(
          prepared.canvas,
          (box) => mapBoxToSource(prepared, box),
          source.canvas.width,
          source.canvas.height,
        );
      } else {
        result = await recognizeCanvas(source.canvas, (box) => box, source.canvas.width, source.canvas.height);
      }
      confidences.push(result.confidence);
      lines.push(...result.lines.map((line) => ({ ...line, page: index })));
    }
    reportRecognition = null;
    const confidence = confidences.reduce((sum, value) => sum + value, 0) / Math.max(1, confidences.length);
    return { lines, parsed: combine(lines, confidence, startedAt), skewAngle };
  };

  let best = { ...(await runPass(false, 18, 62)), method: 'ocr' as ExtractionMethod };
  let passes = 1;
  let quality = scoreExtraction(best.parsed, best.lines);

  // Photos, shadows and bordered tables: retry on a levelled, binarised copy
  // and keep whichever reading is more complete and self-consistent.
  if (!quality.complete) {
    const second = await runPass(true, 62, 92);
    passes = 2;
    const secondQuality = scoreExtraction(second.parsed, second.lines);
    if (secondQuality.score > quality.score) {
      best = { ...second, method: 'ocr-enhanced' };
      quality = secondQuality;
    }
  }

  onProgress({ label: 'Structuring invoice fields', value: 96 });
  best.parsed.data.processingMs = performance.now() - startedAt;
  onProgress({ label: 'Ready to review', value: 100 });

  return {
    ...best.parsed,
    lines: best.lines,
    pages: sources.map((source) => source.page),
    pageCount,
    method: best.method,
    skewAngle: best.method === 'ocr-enhanced' ? best.skewAngle : 0,
    passes,
  };
}
