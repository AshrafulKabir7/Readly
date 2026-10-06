/**
 * Image clean-up for photographed or scanned invoices, run on a canvas before
 * OCR. Clean digital images read best untouched, so this is the second pass:
 *
 * 1. deskew: the rotation that maximises the variance of row ink sums
 *    (text lines become sharp horizontal bands when level),
 * 2. upscale to roughly 300 dpi for a letter-sized page,
 * 3. adaptive (Sauvola) binarisation to flatten uneven lighting and shadows,
 * 4. remove long horizontal and vertical rules, because table borders make
 *    Tesseract's layout analysis drop whole table rows.
 */

export type EnhancedImage = {
  canvas: HTMLCanvasElement;
  /** Degrees the source was rotated by to level it. */
  angle: number;
  /** Enhanced pixels per source pixel. */
  scale: number;
  sourceWidth: number;
  sourceHeight: number;
};

type Drawable = HTMLCanvasElement | HTMLImageElement | ImageBitmap;

function sizeOf(source: Drawable) {
  if (source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  return { width: source.width, height: source.height };
}

function luminance(data: Uint8ClampedArray, offset: number) {
  return data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114;
}

export function estimateSkew(source: Drawable, maxDegrees = 8): number {
  const { width, height } = sizeOf(source);
  const sampleWidth = Math.min(700, width);
  const sampleHeight = Math.max(1, Math.round((height * sampleWidth) / width));
  const canvas = document.createElement('canvas');
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return 0;
  context.drawImage(source, 0, 0, sampleWidth, sampleHeight);
  const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;

  // Ink is anything clearly darker than its neighbourhood. A global threshold
  // would also count a dark table or desk around the page, whose straight
  // edge then dominates the angle search.
  const gray = new Float32Array(sampleWidth * sampleHeight);
  for (let index = 0; index < gray.length; index += 1) gray[index] = luminance(pixels, index * 4);
  const stride = sampleWidth + 1;
  const integral = new Float64Array(stride * (sampleHeight + 1));
  for (let y = 0; y < sampleHeight; y += 1) {
    let rowSum = 0;
    for (let x = 0; x < sampleWidth; x += 1) {
      rowSum += gray[y * sampleWidth + x];
      integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + rowSum;
    }
  }
  const radius = 10;
  const ink: number[] = [];
  for (let y = 0; y < sampleHeight; y += 1) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(sampleHeight, y + radius + 1);
    for (let x = 0; x < sampleWidth; x += 1) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(sampleWidth, x + radius + 1);
      const mean =
        (integral[y1 * stride + x1] - integral[y0 * stride + x1] - integral[y1 * stride + x0] + integral[y0 * stride + x0]) /
        ((y1 - y0) * (x1 - x0));
      if (gray[y * sampleWidth + x] < mean - 28) ink.push(x - sampleWidth / 2, y - sampleHeight / 2);
    }
  }
  if (ink.length < 200) return 0;

  let best = 0;
  let bestScore = -1;
  for (let angle = -maxDegrees; angle <= maxDegrees + 0.001; angle += 0.25) {
    const radians = (angle * Math.PI) / 180;
    const sin = Math.sin(radians);
    const cos = Math.cos(radians);
    const rows = new Float32Array(sampleHeight * 2);
    for (let index = 0; index < ink.length; index += 2) {
      const row = Math.round(ink[index] * sin + ink[index + 1] * cos + sampleHeight);
      if (row >= 0 && row < rows.length) rows[row] += 1;
    }
    let score = 0;
    for (let row = 1; row < rows.length; row += 1) {
      const delta = rows[row] - rows[row - 1];
      score += delta * delta;
    }
    if (score > bestScore) {
      bestScore = score;
      best = angle;
    }
  }
  return Math.abs(best) < 0.3 ? 0 : best;
}

export function enhanceDocument(source: Drawable): EnhancedImage {
  const { width: sourceWidth, height: sourceHeight } = sizeOf(source);
  const longSide = Math.max(sourceWidth, sourceHeight);
  const scale = Math.min(2.5, Math.max(0.6, 2200 / longSide));
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);
  const angle = estimateSkew(source);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Your browser could not prepare the image.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.imageSmoothingQuality = 'high';
  context.translate(width / 2, height / 2);
  context.rotate((angle * Math.PI) / 180);
  context.drawImage(source, -width / 2, -height / 2, width, height);
  context.setTransform(1, 0, 0, 1, 0, 0);

  const image = context.getImageData(0, 0, width, height);
  const pixels = image.data;
  const count = width * height;
  const gray = new Float32Array(count);
  for (let index = 0; index < count; index += 1) gray[index] = luminance(pixels, index * 4);

  // Integral images of the value and its square give each window's mean and
  // standard deviation in constant time.
  const stride = width + 1;
  const integral = new Float64Array(stride * (height + 1));
  const integralSq = new Float64Array(stride * (height + 1));
  for (let y = 0; y < height; y += 1) {
    let rowSum = 0;
    let rowSq = 0;
    for (let x = 0; x < width; x += 1) {
      const value = gray[y * width + x];
      rowSum += value;
      rowSq += value * value;
      integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + rowSum;
      integralSq[(y + 1) * stride + x + 1] = integralSq[y * stride + x + 1] + rowSq;
    }
  }

  const radius = Math.max(12, Math.round(Math.min(width, height) / 40));
  const ink = new Uint8Array(count);
  for (let y = 0; y < height; y += 1) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(height, y + radius + 1);
    for (let x = 0; x < width; x += 1) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(width, x + radius + 1);
      const area = (y1 - y0) * (x1 - x0);
      const a = y1 * stride + x1;
      const b = y0 * stride + x1;
      const c = y1 * stride + x0;
      const d = y0 * stride + x0;
      const mean = (integral[a] - integral[b] - integral[c] + integral[d]) / area;
      const meanSq = (integralSq[a] - integralSq[b] - integralSq[c] + integralSq[d]) / area;
      const deviation = Math.sqrt(Math.max(0, meanSq - mean * mean));
      ink[y * width + x] = gray[y * width + x] < mean * (1 + 0.2 * (deviation / 128 - 1)) ? 1 : 0;
    }
  }

  // Runs of ink much longer than any glyph are table rules or page edges.
  const remove = new Uint8Array(count);
  const minHorizontal = Math.round(width / 12);
  const minVertical = Math.round(height / 14);
  for (let y = 0; y < height; y += 1) {
    let x = 0;
    while (x < width) {
      if (!ink[y * width + x]) {
        x += 1;
        continue;
      }
      let end = x;
      while (end < width && (ink[y * width + end] || (end + 1 < width && ink[y * width + end + 1]))) end += 1;
      if (end - x >= minHorizontal) for (let k = x; k < end; k += 1) remove[y * width + k] = 1;
      x = end + 1;
    }
  }
  for (let x = 0; x < width; x += 1) {
    let y = 0;
    while (y < height) {
      if (!ink[y * width + x]) {
        y += 1;
        continue;
      }
      let end = y;
      while (end < height && (ink[end * width + x] || (end + 1 < height && ink[(end + 1) * width + x]))) end += 1;
      if (end - y >= minVertical) for (let k = y; k < end; k += 1) remove[k * width + x] = 1;
      y = end + 1;
    }
  }

  for (let index = 0; index < count; index += 1) {
    const value = ink[index] && !remove[index] ? 0 : 255;
    const offset = index * 4;
    pixels[offset] = value;
    pixels[offset + 1] = value;
    pixels[offset + 2] = value;
    pixels[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);

  return { canvas, angle, scale, sourceWidth, sourceHeight };
}

/** Maps a box from enhanced-image pixels back to the original image's pixels. */
export function mapBoxToSource(
  enhanced: Pick<EnhancedImage, 'angle' | 'scale' | 'canvas'>,
  box: { x0: number; y0: number; x1: number; y1: number },
) {
  const { width, height } = enhanced.canvas;
  const radians = (-enhanced.angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const corners = [
    [box.x0, box.y0],
    [box.x1, box.y0],
    [box.x0, box.y1],
    [box.x1, box.y1],
  ].map(([x, y]) => {
    const dx = x - width / 2;
    const dy = y - height / 2;
    return [
      (width / 2 + dx * cos - dy * sin) / enhanced.scale,
      (height / 2 + dx * sin + dy * cos) / enhanced.scale,
    ];
  });
  const xs = corners.map((corner) => corner[0]);
  const ys = corners.map((corner) => corner[1]);
  return {
    x0: Math.min(...xs),
    y0: Math.min(...ys),
    x1: Math.max(...xs),
    y1: Math.max(...ys),
  };
}
