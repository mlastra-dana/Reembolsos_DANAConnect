import { extractPdfText, normalizeForValidation, renderPdfFirstPageToCanvas } from "./extractText";
import { analyzeCanvas, analyzeImage } from "./imageSignals";
import type { DocType } from "./types";
import { ocrImage, ocrPdfFirstPage } from "./ocr";

export type ClassifyResult = {
  docType: DocType;
};

type Scores = {
  factura: number;
  informe: number;
  evidencia: number;
};

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function countMatches(text: string, terms: string[]): number {
  return terms.reduce((count, term) => (text.includes(term) ? count + 1 : count), 0);
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

function hasRepeatedAmounts(text: string): boolean {
  const withDecimals = text.match(/\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})\b/g);
  if ((withDecimals?.length ?? 0) >= 3) return true;
  const withCurrency = text.match(/(bs|usd|\$|eur|rd\$)\s*\d+/g);
  return (withCurrency?.length ?? 0) >= 2;
}

function scorePdfText(text: string): Scores {
  const scores: Scores = { factura: 0, informe: 0, evidencia: 0 };

  // FACTURA
  if (includesAny(text, ["factura", "boleta", "comprobante", "recibo"])) scores.factura += 3;
  if (includesAny(text, ["total", "total a pagar", "subtotal"])) scores.factura += 2;
  if (includesAny(text, ["ruc", "rif", "nit", "cuit"])) scores.factura += 2;
  if (includesAny(text, ["iva", "igv", "itbis"])) scores.factura += 2;
  if (includesAny(text, ["honorarios", "honorarios medicos"])) scores.factura += 2;
  if (hasRepeatedAmounts(text)) scores.factura += 1;

  // INFORME / RECETA
  if (includesAny(text, ["informe", "epicrisis"])) scores.informe += 3;
  if (includesAny(text, ["diagnostico"])) scores.informe += 3;
  if (includesAny(text, ["indicaciones", "tratamiento", "dosis", "posologia"])) scores.informe += 2;
  if (includesAny(text, ["receta", "rp", "orden medica"])) scores.informe += 2;
  if (includesAny(text, ["paciente"])) scores.informe += 1;
  if (includesAny(text, ["dr", "dra", "medico", "firma", "sello"])) scores.informe += 1;
  if (includesAny(text, ["psiquiatra", "pediatra", "dermatologo", "oftalmologo", "especialista"])) {
    scores.informe += 2;
  }
  if (includesAny(text, ["tableta", "tabletas", "capsula", "capsulas", "gotas", "cada", "am", "pm"])) {
    scores.informe += 1;
  }
  const rxInstructionHits = countMatches(text, [
    "darle",
    "tomar",
    "tomar ",
    "tableta",
    "tabletas",
    "capsula",
    "capsulas",
    "gotas",
    "mg",
    "am",
    "pm",
    "cada"
  ]);
  if (rxInstructionHits >= 2) {
    scores.informe += 5;
  }
  if (includesAny(text, ["dra.", "dr.", "medico psiquiatra", "medico pediatra"])) {
    scores.informe += 3;
  }

  // EVIDENCIA
  if (includesAny(text, ["resultado", "examen", "laboratorio"])) scores.evidencia += 3;
  if (includesAny(text, ["valores de referencia", "rango"])) scores.evidencia += 2;
  if (includesAny(text, ["mg/dl", "g/dl", "mmol", "%", "u/l"])) scores.evidencia += 2;
  if (includesAny(text, ["radiografia", "ecografia", "mamografia", "tac", "resonancia"])) {
    scores.evidencia += 2;
  }
  if (includesAny(text, ["reporte", "analisis", "composicion corporal", "inbody"])) {
    scores.evidencia += 2;
  }

  return scores;
}

function decideFromPdfScores(scores: Scores): DocType {
  if (scores.factura >= 4) return "FACTURA";
  if (scores.informe >= 4) return "INFORME_RECETA";
  if (scores.evidencia >= 4) return "EVIDENCIA";
  return "UNKNOWN";
}

function applyVisualScores(
  signals: { avgBrightness: number; darkRatio: number; edgeDensity: number },
  scores: Scores
) {
  if (signals.darkRatio > 0.45 && signals.avgBrightness < 150) {
    scores.evidencia += 4;
  }
  if (signals.edgeDensity > 0.2) {
    scores.evidencia += 3;
  }
  if (
    signals.avgBrightness > 170 &&
    signals.edgeDensity >= 0.1 &&
    signals.edgeDensity <= 0.2 &&
    signals.darkRatio >= 0.08
  ) {
    scores.factura += 3;
  }
  if (
    signals.avgBrightness > 170 &&
    signals.edgeDensity < 0.16 &&
    signals.darkRatio >= 0.03 &&
    signals.darkRatio <= 0.2
  ) {
    scores.informe += 3;
  }
  // Ajuste puntual para recetas manuscritas (más tolerante, sin afectar FACTURA por prioridad).
  if (
    signals.avgBrightness > 165 &&
    signals.edgeDensity >= 0.03 &&
    signals.edgeDensity <= 0.22 &&
    signals.darkRatio >= 0.02 &&
    signals.darkRatio <= 0.22
  ) {
    scores.informe += 2;
  }
  // Receta manuscrita con mayor densidad de trazo: debe inclinarse a INFORME_RECETA.
  if (
    signals.avgBrightness > 155 &&
    signals.edgeDensity > 0.2 &&
    signals.edgeDensity <= 0.38 &&
    signals.darkRatio >= 0.03 &&
    signals.darkRatio <= 0.25
  ) {
    scores.informe += 5;
  }
}

function applyFilenameSupport(fileName: string, scores: Scores) {
  const normalized = normalizeForValidation(fileName);
  if (includesAny(normalized, ["factura", "boleta", "recibo", "comprobante", "honorario", "farmacia"])) {
    scores.factura += 1;
  }
  if (includesAny(normalized, ["receta", "rp", "indicacion", "orden", "informe", "epicrisis"])) {
    scores.informe += 1;
  }
  if (includesAny(normalized, ["rx", "eco", "mamo", "lab", "resultado", "estudio", "inbody", "reporte"])) {
    scores.evidencia += 1;
  }
}

function decideFinal(scores: Scores): DocType {
  const { factura, informe, evidencia } = scores;
  const maxScore = Math.max(factura, informe, evidencia);
  if (maxScore < 2) return "UNKNOWN";

  const tied: DocType[] = [];
  if (factura === maxScore) tied.push("FACTURA");
  if (informe === maxScore) tied.push("INFORME_RECETA");
  if (evidencia === maxScore) tied.push("EVIDENCIA");
  if (tied.length === 1) return tied[0];

  if (factura >= 2) return "FACTURA";
  if (informe >= 2) return "INFORME_RECETA";
  if (evidencia >= 2) return "EVIDENCIA";
  return "UNKNOWN";
}

export async function classifyDocument(file: File): Promise<ClassifyResult> {
  const scores: Scores = { factura: 0, informe: 0, evidencia: 0 };
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/");
  let canUseFilenameSupport = true;

  if (isPdf) {
    const pdfNativeText = await extractPdfText(file);
    const pdfTextRaw = await file.text().catch(() => "");
    const hintText = extractEmbeddedTextHint(file);
    const rawNormalized = normalizeForValidation(pdfTextRaw);
    const looksLikePdfSyntax =
      rawNormalized.includes("pdf-") ||
      rawNormalized.includes("endobj") ||
      rawNormalized.includes("stream") ||
      rawNormalized.includes("xref") ||
      rawNormalized.includes("trailer");
    const text = pdfNativeText || (looksLikePdfSyntax ? "" : rawNormalized) || hintText;

    if (text.length >= 120) {
      canUseFilenameSupport = false;
      const pdfScores = scorePdfText(text);
      const docType = decideFromPdfScores(pdfScores);
      if (docType !== "UNKNOWN") return { docType };
      scores.factura += pdfScores.factura;
      scores.informe += pdfScores.informe;
      scores.evidencia += pdfScores.evidencia;
    } else {
      const canvas = await renderPdfFirstPageToCanvas(file);
      if (canvas) {
        const signals = await analyzeCanvas(canvas);
        applyVisualScores(signals, scores);
      }
      try {
        const ocrText = await ocrPdfFirstPage(file);
        if (ocrText.length >= 40) {
          const ocrScores = scorePdfText(ocrText);
          scores.factura += ocrScores.factura;
          scores.informe += ocrScores.informe;
          scores.evidencia += ocrScores.evidencia;
        }
      } catch {
        // OCR solo complementa el score.
      }
    }
  } else if (isImage) {
    const signals = await analyzeImage(file);
    applyVisualScores(signals, scores);
      try {
        const ocrText = await ocrImage(file);
      if (ocrText.length >= 10) {
        const ocrScores = scorePdfText(ocrText);
        scores.factura += ocrScores.factura;
        scores.informe += ocrScores.informe;
        scores.evidencia += ocrScores.evidencia;
      }
    } catch {
      // OCR solo complementa el score.
    }
  }

  if (canUseFilenameSupport) {
    applyFilenameSupport(file.name, scores);
  }

  return { docType: decideFinal(scores) };
}
