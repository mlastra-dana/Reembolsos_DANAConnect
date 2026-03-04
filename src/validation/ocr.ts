import { createWorker } from "tesseract.js";
import type { Worker } from "tesseract.js";
import { renderPdfFirstPageToCanvas } from "./extractText";
import { normalizeForValidation } from "./extractText";

const ocrCache = new Map<string, Promise<string>>();
let workerPromise: Promise<Worker> | null = null;

function fileKey(file: File, mode: "pdf" | "image"): string {
  return `${mode}:${file.name}:${file.size}:${file.lastModified}:${file.type}`;
}

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      try {
        return await createWorker("spa+eng");
      } catch {
        return await createWorker("eng");
      }
    })();
  }
  return workerPromise;
}

function preprocessCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const targetWidth = 1200;
  const scale = Math.min(1, targetWidth / source.width);
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return source;

  ctx.drawImage(source, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const threshold = gray > 185 ? 255 : gray < 85 ? 0 : gray * 1.05;
    const value = Math.max(0, Math.min(255, threshold));
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

async function canvasFromImageFile(file: File): Promise<HTMLCanvasElement | null> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("No image"));
      element.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return canvas;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function recognizeCanvas(canvas: HTMLCanvasElement): Promise<string> {
  const worker = await getWorker();
  const processed = preprocessCanvas(canvas);
  const { data } = await worker.recognize(processed);
  return normalizeForValidation(data.text || "");
}

export async function ocrPdfFirstPage(file: File): Promise<string> {
  const key = fileKey(file, "pdf");
  const cached = ocrCache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    const canvas = await renderPdfFirstPageToCanvas(file);
    if (!canvas) throw new Error("OCR_FAILED");
    const text = await recognizeCanvas(canvas);
    if (!text || text.length < 20) return "";
    return text;
  })();

  ocrCache.set(key, promise);
  return promise;
}

export async function ocrImage(file: File): Promise<string> {
  const key = fileKey(file, "image");
  const cached = ocrCache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    const canvas = await canvasFromImageFile(file);
    if (!canvas) throw new Error("OCR_FAILED");
    const text = await recognizeCanvas(canvas);
    if (!text || text.length < 20) return "";
    return text;
  })();

  ocrCache.set(key, promise);
  return promise;
}
