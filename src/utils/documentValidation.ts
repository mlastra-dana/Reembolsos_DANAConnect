import { analyzeImage } from "./imageHeuristics";

export type ExpectedSlot = "FACTURA" | "INFORME_RECETA" | "EVIDENCIA_ADICIONAL";
type DetectedType = ExpectedSlot | "INDETERMINADO";

interface ValidationResult {
  isValid: boolean;
  detectedType: DetectedType;
  errorDetail: string | null;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function hasAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function hasCurrency(text: string): boolean {
  return /(^|[\s:])(\$|S\/|USD|EUR|BS|B\/\.|RD\$|MXN|COP|PEN|VES)([\s\d]|$)/.test(text);
}

function hasAmount(text: string): boolean {
  return /\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})\b/.test(text);
}

function hasEnoughText(text: string): boolean {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length >= 4 && text.trim().length >= 20;
}

function looksLikePdfRawContent(text: string): boolean {
  const normalized = normalizeText(text);
  const syntaxHits = [
    "PDF-",
    "ENDOBJ",
    "STREAM",
    "ENDSTREAM",
    "XREF",
    "TRAILER",
    "REPORTLAB",
    "ASCII85DECODE",
    "FLATEDECODE"
  ].filter((token) => normalized.includes(token)).length;
  return syntaxHits >= 2;
}

function hasMultiplePrices(text: string): boolean {
  const matches = text.match(/\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})\b/g);
  return (matches?.length ?? 0) >= 3;
}

function hasItemTable(text: string): boolean {
  const hasColumns = hasAny(text, [
    "DESCRIPCION",
    "CANTIDAD",
    "PRECIO",
    "P. UNIT",
    "IMPORTE",
    "MONTO"
  ]);
  const linesWithAmounts = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => /\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})\b/.test(line)).length;
  return hasColumns || linesWithAmounts >= 2 || hasMultiplePrices(text);
}

function classifyText(rawText: string): DetectedType {
  const text = normalizeText(rawText);
  if (!hasEnoughText(text)) return "INDETERMINADO";

  const facturaHeader = hasAny(text, [
    "FACTURA",
    "RECIBO",
    "COMPROBANTE",
    "BOLETA",
    "N° DE CONTROL",
    "NRO DE CONTROL",
    "FACTURA N°"
  ]);
  const facturaFiscalId = hasAny(text, ["RIF", "RUC", "NIT", "CUIT"]);
  const facturaTotals = hasAny(text, ["TOTAL A PAGAR", "TOTAL", "SUBTOTAL"]);
  const impuestos = hasAny(text, ["IGV", "IVA", "ITBIS"]);
  const facturaItems = hasItemTable(text);
  const facturaMonetary = hasCurrency(text) || hasAmount(text);
  const honorarios = hasAny(text, ["HONORARIOS", "CONSULTA MEDICA", "SERVICIO PROFESIONAL"]);
  const facturaStrongSignals = [
    facturaHeader,
    facturaFiscalId,
    facturaTotals,
    impuestos,
    facturaItems
  ].filter(Boolean).length;
  const facturaDetectedByStrongRules = facturaStrongSignals >= 2;

  const hasFacturaStructure =
    (facturaHeader && facturaTotals && (facturaFiscalId || facturaMonetary)) ||
    (facturaTotals && facturaFiscalId && facturaMonetary) ||
    (facturaHeader && facturaItems && facturaMonetary);

  if (
    hasFacturaStructure ||
    (facturaDetectedByStrongRules && facturaMonetary) ||
    (honorarios && facturaDetectedByStrongRules)
  ) {
    return "FACTURA";
  }

  const clinicalCore = hasAny(text, [
    "RECETA",
    "PRESCRIPCION",
    "INDICACIONES",
    "DOSIS",
    "TRATAMIENTO",
    "DIAGNOSTICO",
    "IMPRESION DIAGNOSTICA",
    "PLAN",
    "EVOLUCION",
    "HISTORIA CLINICA"
  ]);
  const medico = hasAny(text, ["DR", "DRA", "FIRMA", "CMP", "COLEGIATURA", "COLEGIADO"]);
  const paciente = hasAny(text, ["PACIENTE", "NOMBRE DEL PACIENTE", "PACIENTE:"]);
  const informeScore = [clinicalCore, medico, paciente].filter(Boolean).length;
  const hasBillingSmell =
    facturaHeader ||
    facturaTotals ||
    facturaDetectedByStrongRules ||
    (facturaFiscalId && facturaMonetary);

  if (informeScore >= 2 && !hasBillingSmell) return "INFORME_RECETA";

  const imaging = hasAny(text, [
    "RADIOGRAFIA",
    "ECOGRAFIA",
    "ULTRASONIDO",
    "RESONANCIA",
    "TOMOGRAFIA",
    "RX",
    "MRI",
    "CT"
  ]);
  const laboratorio = hasAny(text, ["LABORATORIO", "RESULTADO", "HEMOGRAMA", "GLUCOSA"]);
  const hallazgos = hasAny(text, ["HALLAZGOS", "CONCLUSION", "IMAGEN DIAGNOSTICA"]);
  const labStructure =
    hasAny(text, ["VALOR", "REFERENCIA", "RANGO", "UNIDADES"]) ||
    /\b(MG\/DL|G\/DL|MMOL\/L|UI\/L|X10\^?\d)\b/.test(text);
  const evidenciaScore = [imaging, laboratorio, hallazgos, labStructure].filter(Boolean).length;

  if (evidenciaScore >= 1 && !hasBillingSmell && informeScore < 2) return "EVIDENCIA_ADICIONAL";

  return "INDETERMINADO";
}

function inferByFilenameWeak(fileName: string): DetectedType {
  const name = normalizeText(fileName);
  if (hasAny(name, ["RECETA", "RP", "INDICACIONES", "ORDEN", "INFORME", "EPICRISIS"])) {
    return "INFORME_RECETA";
  }
  if (hasAny(name, ["FACTURA", "BOLETA", "RECIBO", "HONORARIO", "COMPROBANTE", "FARMACIA"])) {
    return "FACTURA";
  }
  if (hasAny(name, ["RX", "ECO", "LAB", "RESULTADO", "INBODY", "ESTUDIO"])) {
    return "EVIDENCIA_ADICIONAL";
  }
  return "INDETERMINADO";
}

async function classifyByFile(
  file: File,
  extractedText: string
): Promise<{ detectedType: DetectedType }> {
  if (file.type.startsWith("image/")) {
    const analysis = await analyzeImage(file);
    if (analysis.kind === "RECETA_MANUSCRITA") {
      return { detectedType: "INFORME_RECETA" };
    }
    if (analysis.kind === "DOCUMENTO_TABULAR") {
      return { detectedType: "FACTURA" };
    }
    if (analysis.kind === "IMAGEN_DIAGNOSTICA" || analysis.kind === "REPORTE_ESTUDIO") {
      return { detectedType: "EVIDENCIA_ADICIONAL" };
    }
    if (analysis.kind === "INDETERMINADO") {
      return { detectedType: inferByFilenameWeak(file.name) };
    }
    return { detectedType: "INDETERMINADO" };
  }

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const providedText = extractedText?.trim() ?? "";
    const pdfText = providedText || (await file.text().catch(() => ""));
    if (!hasEnoughText(normalizeText(pdfText)) || (!providedText && looksLikePdfRawContent(pdfText))) {
      return { detectedType: inferByFilenameWeak(file.name) };
    }
    return { detectedType: classifyText(pdfText) };
  }

  const text = extractedText?.trim() ?? "";
  if (!hasEnoughText(normalizeText(text))) {
    return { detectedType: inferByFilenameWeak(file.name) };
  }
  return { detectedType: classifyText(text) };
}

function getSlotErrorDetail(slot: ExpectedSlot): string {
  if (slot === "FACTURA") return "El documento no corresponde a una factura válida.";
  if (slot === "INFORME_RECETA")
    return "El documento no corresponde a un informe o receta médica.";
  return "El documento no corresponde a evidencia médica adicional.";
}

export async function validateForSlot(
  file: File,
  expectedSlot: ExpectedSlot,
  extractedText = ""
): Promise<ValidationResult> {
  const { detectedType } = await classifyByFile(file, extractedText);
  const isValid = detectedType === expectedSlot;

  if (isValid) {
    return { isValid: true, detectedType, errorDetail: null };
  }

  return {
    isValid: false,
    detectedType,
    errorDetail: getSlotErrorDetail(expectedSlot)
  };
}

export async function validateDocumentBySlot(
  file: File,
  extractedText: string,
  expectedSlot: ExpectedSlot
): Promise<ValidationResult> {
  return validateForSlot(file, expectedSlot, extractedText);
}
