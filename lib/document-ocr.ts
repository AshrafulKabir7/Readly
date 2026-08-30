import { parseInvoiceText, type InvoiceData } from '@/lib/invoice';

export type OcrProgress = {
  label: string;
  value: number;
};

export type OcrResult = {
  data: InvoiceData;
  previewUrl: string;
  pages: number;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const acceptedTypes = ['application/pdf', 'image/png', 'image/jpeg'];

async function renderPdfFirstPage(file: File): Promise<{
  image: string;
  pages: number;
}> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const page = await document.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = window.document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) throw new Error('Your browser could not prepare the PDF for OCR.');

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvas, canvasContext: context, viewport }).promise;

  return {
    image: canvas.toDataURL('image/png', 0.94),
    pages: document.numPages,
  };
}

export async function processDocument(
  file: File,
  onProgress: (progress: OcrProgress) => void,
): Promise<OcrResult> {
  if (!acceptedTypes.includes(file.type)) {
    throw new Error('Please upload a PDF, PNG, or JPG document.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('This file is larger than 10 MB.');
  }

  const startedAt = performance.now();
  onProgress({ label: 'Preparing document', value: 8 });

  let imageSource: string | File = file;
  let previewUrl = URL.createObjectURL(file);
  let pages = 1;

  if (file.type === 'application/pdf') {
    const rendered = await renderPdfFirstPage(file);
    imageSource = rendered.image;
    previewUrl = rendered.image;
    pages = rendered.pages;
  }

  onProgress({ label: 'Starting OCR engine', value: 14 });
  const { recognize } = await import('tesseract.js');
  const result = await recognize(imageSource, 'eng', {
    logger: (message) => {
      if (message.status === 'recognizing text') {
        onProgress({
          label: 'Reading text and amounts',
          value: 18 + Math.round((message.progress ?? 0) * 72),
        });
      }
    },
  });

  onProgress({ label: 'Structuring invoice fields', value: 94 });
  const processingMs = performance.now() - startedAt;
  const data = parseInvoiceText(
    result.data.text,
    result.data.confidence,
    processingMs,
  );

  onProgress({ label: 'Ready to review', value: 100 });
  return { data, previewUrl, pages };
}
