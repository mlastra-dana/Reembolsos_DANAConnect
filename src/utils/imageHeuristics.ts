export type ImageKind =
  | "RECETA_MANUSCRITA"
  | "DOCUMENTO_TABULAR"
  | "IMAGEN_DIAGNOSTICA"
  | "REPORTE_ESTUDIO"
  | "INDETERMINADO";

export interface ImageAnalysisResult {
  kind: ImageKind;
  confidence: number;
}

function getImageDataFromElement(
  source: CanvasImageSource,
  width: number,
  height: number
): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("No se pudo inicializar el canvas para analizar la imagen.");
  }
  ctx.drawImage(source, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

function analyzePixels(imageData: ImageData): ImageAnalysisResult {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  let sum = 0;
  let dark = 0;
  const luminance = new Float32Array(width * height);
  const darkMask = new Uint8Array(width * height);
  const pixelCount = data.length / 4;

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    luminance[p] = brightness;
    sum += brightness;
    if (brightness < 70) dark += 1;
    if (brightness < 175) darkMask[p] = 1;
  }

  const avgBrightness = sum / pixelCount;
  const darkRatio = dark / pixelCount;
  let edgeCount = 0;
  const edgeThreshold = 90;
  const edgeSamples = (width - 1) * (height - 1);

  for (let y = 0; y < height - 1; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const idx = y * width + x;
      const gx = Math.abs(luminance[idx] - luminance[idx + 1]);
      const gy = Math.abs(luminance[idx] - luminance[idx + width]);
      if (gx + gy > edgeThreshold) edgeCount += 1;
    }
  }
  const edgeDensity = edgeSamples > 0 ? edgeCount / edgeSamples : 0;
  let rowLongRuns = 0;
  let colLongRuns = 0;
  const rowRunThreshold = Math.floor(width * 0.55);
  const colRunThreshold = Math.floor(height * 0.55);

  for (let y = 0; y < height; y += 1) {
    let currentRun = 0;
    let maxRun = 0;
    for (let x = 0; x < width; x += 1) {
      const isDark = darkMask[y * width + x] === 1;
      currentRun = isDark ? currentRun + 1 : 0;
      if (currentRun > maxRun) maxRun = currentRun;
    }
    if (maxRun >= rowRunThreshold) rowLongRuns += 1;
  }

  for (let x = 0; x < width; x += 1) {
    let currentRun = 0;
    let maxRun = 0;
    for (let y = 0; y < height; y += 1) {
      const isDark = darkMask[y * width + x] === 1;
      currentRun = isDark ? currentRun + 1 : 0;
      if (currentRun > maxRun) maxRun = currentRun;
    }
    if (maxRun >= colRunThreshold) colLongRuns += 1;
  }

  if (darkRatio > 0.45 && avgBrightness < 150) {
    const confidence = Math.min(
      0.99,
      0.6 + (darkRatio - 0.45) * 0.9 + (150 - avgBrightness) / 240
    );
    return { kind: "IMAGEN_DIAGNOSTICA", confidence };
  }

  if (
    avgBrightness > 160 &&
    edgeDensity >= 0.07 &&
    edgeDensity <= 0.32 &&
    darkRatio >= 0.03 &&
    darkRatio <= 0.38 &&
    (rowLongRuns >= 4 || colLongRuns >= 2)
  ) {
    const confidence = Math.min(
      0.99,
      0.58 +
        (avgBrightness - 160) / 330 +
        (edgeDensity - 0.07) * 0.9 +
        (0.38 - Math.abs(0.2 - darkRatio)) * 0.25
    );
    return { kind: "DOCUMENTO_TABULAR", confidence };
  }

  // Facturas planilla/honorarios con lineado suave y bajo contraste.
  if (avgBrightness > 150 && darkRatio < 0.45 && rowLongRuns >= 4) {
    const confidence = Math.min(
      0.99,
      0.6 + (avgBrightness - 150) / 320 + (rowLongRuns - 4) * 0.025
    );
    return { kind: "DOCUMENTO_TABULAR", confidence };
  }

  // Tickets/recibos térmicos: alta densidad textual, separadores, poco lineado vertical.
  if (
    avgBrightness > 135 &&
    avgBrightness < 220 &&
    darkRatio >= 0.05 &&
    darkRatio <= 0.5 &&
    edgeDensity >= 0.05 &&
    edgeDensity <= 0.22 &&
    rowLongRuns >= 1 &&
    colLongRuns <= 2
  ) {
    const confidence = Math.min(
      0.99,
      0.58 +
        (edgeDensity - 0.05) * 0.7 +
        (Math.min(darkRatio, 0.3) - 0.05) * 0.35 +
        rowLongRuns * 0.02
    );
    return { kind: "DOCUMENTO_TABULAR", confidence };
  }

  if (
    avgBrightness > 170 &&
    edgeDensity > 0.2 &&
    rowLongRuns < 4 &&
    colLongRuns < 2
  ) {
    const confidence = Math.min(
      0.99,
      0.6 + (avgBrightness - 170) / 260 + (edgeDensity - 0.2) * 0.9
    );
    return { kind: "REPORTE_ESTUDIO", confidence };
  }

  if (
    avgBrightness > 175 &&
    edgeDensity < 0.2 &&
    darkRatio < 0.2 &&
    rowLongRuns < 4 &&
    colLongRuns < 3
  ) {
    const confidence = Math.min(
      0.99,
      0.58 +
        (avgBrightness - 175) / 260 +
        (0.2 - edgeDensity) * 0.45 +
        (0.2 - darkRatio) * 0.4
    );
    return { kind: "RECETA_MANUSCRITA", confidence };
  }

  return { kind: "INDETERMINADO", confidence: 0.5 };
}

export async function analyzeImage(file: File): Promise<ImageAnalysisResult> {
  const sampleSize = 96;

  try {
    if ("createImageBitmap" in window) {
      const bitmap = await createImageBitmap(file);
      try {
        const imageData = getImageDataFromElement(bitmap, sampleSize, sampleSize);
        return analyzePixels(imageData);
      } finally {
        bitmap.close();
      }
    }
  } catch {
    // fallback below
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("No se pudo leer la imagen."));
      element.src = objectUrl;
    });
    const imageData = getImageDataFromElement(img, sampleSize, sampleSize);
    return analyzePixels(imageData);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
