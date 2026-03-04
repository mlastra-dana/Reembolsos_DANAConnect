export type ImageCategory =
  | "XRAY_LIKE"
  | "TEXT_DOC_LIKE"
  | "REPORT_LIKE"
  | "UNKNOWN";

export type ImageSignals = {
  category: ImageCategory;
  avgBrightness: number;
  darkRatio: number;
  edgeDensity: number;
};

function computeSignals(imageData: ImageData): ImageSignals {
  const { data, width, height } = imageData;
  const pixelCount = data.length / 4;
  const luminance = new Float32Array(pixelCount);
  let sum = 0;
  let dark = 0;

  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    luminance[p] = luma;
    sum += luma;
    if (luma < 70) dark += 1;
  }

  const avgBrightness = sum / pixelCount;
  const darkRatio = dark / pixelCount;
  let edgeCount = 0;
  const edgeSamples = (width - 1) * (height - 1);

  for (let y = 0; y < height - 1; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const idx = y * width + x;
      const edge = Math.abs(luminance[idx] - luminance[idx + 1]) +
        Math.abs(luminance[idx] - luminance[idx + width]);
      if (edge > 85) edgeCount += 1;
    }
  }

  const edgeDensity = edgeSamples > 0 ? edgeCount / edgeSamples : 0;

  let category: ImageCategory = "UNKNOWN";
  if (darkRatio > 0.45 && avgBrightness < 150) {
    category = "XRAY_LIKE";
  } else if (edgeDensity > 0.18) {
    category = "REPORT_LIKE";
  } else if (avgBrightness > 170 && edgeDensity >= 0.05 && edgeDensity <= 0.2) {
    category = "TEXT_DOC_LIKE";
  }

  return { category, avgBrightness, darkRatio, edgeDensity };
}

export async function analyzeCanvas(canvas: HTMLCanvasElement): Promise<ImageSignals> {
  const sampleSize = 96;
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = sampleSize;
  sampleCanvas.height = sampleSize;
  const ctx = sampleCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return { category: "UNKNOWN", avgBrightness: 0, darkRatio: 0, edgeDensity: 0 };
  }
  ctx.drawImage(canvas, 0, 0, sampleSize, sampleSize);
  const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
  return computeSignals(imageData);
}

export async function analyzeImage(file: File): Promise<ImageSignals> {
  const sampleSize = 96;
  const canvas = document.createElement("canvas");
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return { category: "UNKNOWN", avgBrightness: 0, darkRatio: 0, edgeDensity: 0 };
  }

  const readPixels = (source: CanvasImageSource) => {
    ctx.drawImage(source, 0, 0, sampleSize, sampleSize);
    return ctx.getImageData(0, 0, sampleSize, sampleSize);
  };

  let imageData: ImageData | null = null;

  try {
    if ("createImageBitmap" in window) {
      const bitmap = await createImageBitmap(file);
      try {
        imageData = readPixels(bitmap);
      } finally {
        bitmap.close();
      }
    }
  } catch {
    imageData = null;
  }

  if (!imageData) {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("No image"));
        element.src = objectUrl;
      });
      imageData = readPixels(img);
    } catch {
      return { category: "UNKNOWN", avgBrightness: 0, darkRatio: 0, edgeDensity: 0 };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  return computeSignals(imageData);
}
