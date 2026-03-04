import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
// Vite URL import for pdf.js worker.
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

let pdfWorkerConfigured = false;
const pdfTextCache = new WeakMap<File, Promise<string>>();
const pdfCanvasCache = new WeakMap<File, Promise<HTMLCanvasElement | null>>();

function ensurePdfWorkerConfigured() {
  if (pdfWorkerConfigured) return;
  GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
  pdfWorkerConfigured = true;
}

function normalizeText(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeForValidation(raw: string): string {
  return normalizeText(raw);
}

export async function extractPdfText(file: File): Promise<string> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "";
  const cached = pdfTextCache.get(file);
  if (cached) return cached;

  const promise = (async () => {
    try {
      ensurePdfWorkerConfigured();
      const bytes = new Uint8Array(await file.arrayBuffer());
      const loadingTask = getDocument({ data: bytes });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();
      const rawText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      const normalized = normalizeText(rawText);
      await pdf.destroy();
      if (normalized.length < 20) return "";
      return normalized;
    } catch {
      return "";
    }
  })();

  pdfTextCache.set(file, promise);
  return promise;
}

export async function renderPdfFirstPageToCanvas(file: File): Promise<HTMLCanvasElement | null> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return null;
  const cached = pdfCanvasCache.get(file);
  if (cached) return cached;

  const promise = (async () => {
    try {
      ensurePdfWorkerConfigured();
      const bytes = new Uint8Array(await file.arrayBuffer());
      const loadingTask = getDocument({ data: bytes });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.max(1, 1200 / baseViewport.width);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        await pdf.destroy();
        return null;
      }
      await page.render({ canvasContext: ctx, viewport }).promise;
      await pdf.destroy();
      return canvas;
    } catch {
      return null;
    }
  })();

  pdfCanvasCache.set(file, promise);
  return promise;
}
