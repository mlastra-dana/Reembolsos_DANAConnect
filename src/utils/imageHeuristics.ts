export type ImageKind = "DOCUMENTO_ESCANEADO" | "IMAGEN_DIAGNOSTICA" | "INDETERMINADO";

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
  let sum = 0;
  let sumSq = 0;
  let dark = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    sum += brightness;
    sumSq += brightness * brightness;
    if (brightness < 70) dark += 1;
  }

  const avgBrightness = sum / pixelCount;
  const darkRatio = dark / pixelCount;
  const variance = Math.max(0, sumSq / pixelCount - avgBrightness * avgBrightness);
  const stdDev = Math.sqrt(variance);

  if (darkRatio > 0.45 && avgBrightness < 140) {
    const confidence = Math.min(0.99, 0.55 + (darkRatio - 0.45) * 1.2 + (140 - avgBrightness) / 220 + stdDev / 600);
    return { kind: "IMAGEN_DIAGNOSTICA", confidence };
  }

  if (avgBrightness > 185 && darkRatio < 0.2) {
    const confidence = Math.min(0.99, 0.55 + (avgBrightness - 185) / 220 + (0.2 - darkRatio) * 1.5 + stdDev / 700);
    return { kind: "DOCUMENTO_ESCANEADO", confidence };
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
