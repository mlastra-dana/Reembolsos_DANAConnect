import { normalizeForValidation } from "./extractText";
import { analyzeCanvas, analyzeImage } from "./imageSignals";
import type { DocType } from "./types";
import { renderPdfFirstPageToCanvas } from "./extractText";
import { extractPdfText } from "./extractText";

export type ClassifyResult = {
  docType: DocType;
  confidence: number;
};

type Scores = {
  factura: number;
  informe: number;
  evidencia: number;
};

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function normalizeFileName(fileName: string): string {
  return normalizeForValidation(fileName);
}

function extractEmbeddedTextHint(file: File): string {
  const maybeText = file as File & {
    extractedText?: unknown;
    ocrText?: unknown;
    text?: unknown;
    content?: unknown;
  };
  if (typeof maybeText.extractedText === "string" && maybeText.extractedText.trim()) {
    return normalizeForValidation(maybeText.extractedText);
  }
  if (typeof maybeText.ocrText === "string" && maybeText.ocrText.trim()) {
    return normalizeForValidation(maybeText.ocrText);
  }
  if (typeof maybeText.text === "string" && maybeText.text.trim()) {
    return normalizeForValidation(maybeText.text);
  }
  if (typeof maybeText.content === "string" && maybeText.content.trim()) {
    return normalizeForValidation(maybeText.content);
  }
  return "";
}

function applyPdfScores(text: string, scores: Scores) {
  // FACTURA
  if (includesAny(text, ["factura", "recibo", "boleta"])) scores.factura += 2;
  if (includesAny(text, ["total", "subtotal"])) scores.factura += 1;
  if (includesAny(text, ["ruc", "rif", "nit"])) scores.factura += 1;
  if (includesAny(text, ["iva", "igv", "itbis"])) scores.factura += 1;

  // INFORME / RECETA
  if (includesAny(text, ["informe"])) scores.informe += 2;
  if (includesAny(text, ["diagnostico"])) scores.informe += 2;
  if (includesAny(text, ["descripcion"])) scores.informe += 1;
  if (includesAny(text, ["histopatologico"])) scores.informe += 1;
  if (includesAny(text, ["tratamiento"])) scores.informe += 1;
  if (includesAny(text, ["receta", "indicaciones", "rp"])) scores.informe += 1;
  if (includesAny(text, ["medico", "dra", "dr"])) scores.informe += 1;
  if (includesAny(text, ["paciente"])) scores.informe += 1;

  // EVIDENCIA
  if (includesAny(text, ["resultado"])) scores.evidencia += 2;
  if (includesAny(text, ["examen"])) scores.evidencia += 2;
  if (includesAny(text, ["laboratorio"])) scores.evidencia += 1;
  if (includesAny(text, ["valores de referencia"])) scores.evidencia += 1;
  if (includesAny(text, ["radiografia", "ecografia", "mamografia", "tac", "resonancia"])) {
    scores.evidencia += 1;
  }
  if (includesAny(text, ["reporte"])) scores.evidencia += 1;
}

function applyImageScores(
  signals: { avgBrightness: number; darkRatio: number; edgeDensity: number },
  scores: Scores
) {
  if (signals.darkRatio > 0.45 && signals.avgBrightness < 150) {
    scores.evidencia += 4;
  }
  if (signals.edgeDensity > 0.18) {
    scores.evidencia += 3;
  }
  if (signals.avgBrightness > 170 && signals.edgeDensity >= 0.08 && signals.edgeDensity <= 0.2) {
    scores.factura += 2;
  }
  if (
    signals.avgBrightness > 185 &&
    signals.edgeDensity < 0.1 &&
    signals.darkRatio >= 0.03 &&
    signals.darkRatio <= 0.2
  ) {
    scores.informe += 2;
  }
}

function applyFilenameWeakSignals(fileName: string, scores: Scores) {
  const name = normalizeFileName(fileName);
  if (includesAny(name, ["factura", "recibo", "boleta", "honorario", "farmacia"])) {
    scores.factura += 1;
  }
  if (includesAny(name, ["receta", "rp", "indicacion", "orden", "informe"])) {
    scores.informe += 1;
  }
  if (includesAny(name, ["rx", "eco", "lab", "resultado", "estudio"])) {
    scores.evidencia += 1;
  }
}

function decideDocType(scores: Scores): DocType {
  const { factura, informe, evidencia } = scores;
  const maxScore = Math.max(factura, informe, evidencia);
  if (maxScore === 0) return "UNKNOWN";

  const tied: DocType[] = [];
  if (factura === maxScore) tied.push("FACTURA");
  if (informe === maxScore) tied.push("INFORME_RECETA");
  if (evidencia === maxScore) tied.push("EVIDENCIA");

  if (tied.length === 1) return tied[0];

  if (factura >= 2) return "FACTURA";
  if (informe >= 2) return "INFORME_RECETA";
  if (evidencia > 0) return "EVIDENCIA";
  return "UNKNOWN";
}

function decideTextPriorityDocType(scores: Scores): DocType {
  if (scores.factura >= 4) return "FACTURA";
  if (scores.informe >= 4) return "INFORME_RECETA";
  if (scores.evidencia >= 4) return "EVIDENCIA";
  return "UNKNOWN";
}

function confidenceFromScores(docType: DocType, scores: Scores): number {
  if (docType === "UNKNOWN") return 0;
  const value =
    docType === "FACTURA" ? scores.factura : docType === "INFORME_RECETA" ? scores.informe : scores.evidencia;
  return Math.min(0.99, Math.max(0.55, value / 8));
}

export async function classifyDocument(file: File): Promise<ClassifyResult> {
  const scores: Scores = { factura: 0, informe: 0, evidencia: 0 };
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/");

  if (isPdf) {
    const rawText = normalizeForValidation(await file.text().catch(() => ""));
    const extractedPdfText = await extractPdfText(file);
    const hintedText = extractEmbeddedTextHint(file);
    const text = [extractedPdfText, rawText, hintedText].sort((a, b) => b.length - a.length)[0] ?? "";

    if (text.length >= 80) {
      applyPdfScores(text, scores);
      const textDocType = decideTextPriorityDocType(scores);
      if (textDocType !== "UNKNOWN") {
        return { docType: textDocType, confidence: confidenceFromScores(textDocType, scores) };
      }
    } else {
      const canvas = await renderPdfFirstPageToCanvas(file);
      if (canvas) {
        const visualSignals = await analyzeCanvas(canvas);
        applyImageScores(visualSignals, scores);
      }
    }
  } else if (isImage) {
    const visualSignals = await analyzeImage(file);
    applyImageScores(visualSignals, scores);
  }

  if (Math.max(scores.factura, scores.informe, scores.evidencia) < 2) {
    applyFilenameWeakSignals(file.name, scores);
  }

  const docType = decideDocType(scores);
  return { docType, confidence: confidenceFromScores(docType, scores) };
}
