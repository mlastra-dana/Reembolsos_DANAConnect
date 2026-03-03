import { analyzeImage } from "./imageHeuristics";

export type ExpectedSlot = "FACTURA" | "INFORME_RECETA" | "EVIDENCIA_ADICIONAL";

interface ValidationResult {
  isValid: boolean;
  detectedType: string;
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
  return /(^|[\s:])(\$|S\/|USD|EUR|BS|B\/\.|RD\$|MXN|COP|PEN)([\s\d]|$)/.test(text);
}

function hasAmount(text: string): boolean {
  return /\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})\b/.test(text);
}

function getFacturaSignals(text: string) {
  const invoiceWords = hasAny(text, ["FACTURA", "RECIBO", "COMPROBANTE"]);
  const controlNumber = hasAny(text, [
    "N° DE CONTROL",
    "NRO DE CONTROL",
    "NO. DE CONTROL",
    "FACTURA N°",
    "FACTURA NRO",
    "FACTURA N "
  ]);
  const fiscalId = hasAny(text, ["RIF", "RUC", "NIT", "CUIT"]);
  const totals = hasAny(text, ["TOTAL A PAGAR", "TOTAL", "SUBTOTAL", "IVA", "ITBIS", "IGV"]);
  const billingStructure = hasAny(text, [
    "DESCRIPCION",
    "FORMA DE PAGO",
    "CONDICIONES DE PAGO",
    "RECIBI CONFORME"
  ]);
  const honorarios = hasAny(text, ["HONORARIOS", "CONSULTA MEDICA", "SERVICIO PROFESIONAL"]);
  const monetarySignal = hasCurrency(text) || hasAmount(text);
  const clinicalRxTerms = hasAny(text, [
    "PRESCRIPCION",
    "RECETA",
    "INDICACIONES",
    "DOSIS",
    "TRATAMIENTO",
    "RP/"
  ]);

  const hasStrongBillingStructure =
    ((invoiceWords || controlNumber) && totals && (fiscalId || monetarySignal)) ||
    ((invoiceWords || controlNumber) && fiscalId && monetarySignal);

  const positives = [
    invoiceWords || controlNumber,
    fiscalId,
    totals,
    billingStructure,
    honorarios,
    monetarySignal
  ].filter(Boolean).length;

  const penalty = clinicalRxTerms && !hasStrongBillingStructure ? 1 : 0;
  const score = positives - penalty;

  return {
    hasStrongBillingStructure,
    hasFacturaSmell: invoiceWords || controlNumber || totals || (fiscalId && monetarySignal),
    score
  };
}

function getInformeSignals(text: string) {
  const diagnostico = hasAny(text, [
    "DIAGNOSTICO",
    "IMPRESION DIAGNOSTICA",
    "PLAN",
    "EVOLUCION",
    "INFORME"
  ]);
  const receta = hasAny(text, [
    "RECETA",
    "PRESCRIPCION",
    "INDICACIONES",
    "DOSIS",
    "TRATAMIENTO",
    "RP/"
  ]);
  const medico = hasAny(text, ["DR", "DRA", "FIRMA", "CMP", "COLEGIATURA", "COLEGIADO"]);
  const paciente = hasAny(text, ["PACIENTE", "NOMBRE DEL PACIENTE", "PACIENTE:"]);
  const score = [diagnostico, receta, medico, paciente].filter(Boolean).length;
  return { score };
}

function getEvidenciaSignals(file: File, text: string) {
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
  const labTableLike =
    hasAny(text, ["VALOR", "REFERENCIA", "RANGO", "UNIDADES"]) ||
    /\b(MG\/DL|G\/DL|MMOL\/L|UI\/L|X10\^?\d)\b/.test(text);
  const isImage = file.type.startsWith("image/");
  const score = [imaging, laboratorio, hallazgos, labTableLike].filter(Boolean).length;
  return { isImage, score };
}

function getDetectedType(file: File, text: string): ExpectedSlot | "INDETERMINADO" {
  const factura = getFacturaSignals(text);
  const informe = getInformeSignals(text);
  const evidencia = getEvidenciaSignals(file, text);
  const hasBillingForInformeBlock =
    hasAny(text, ["TOTAL A PAGAR", "IVA", "ITBIS", "IGV", "FACTURA", "RECIBO", "COMPROBANTE"]) ||
    (hasAny(text, ["RIF", "RUC", "NIT", "CUIT"]) && (hasAmount(text) || hasCurrency(text)));

  // Estructura de cobro manda: factura incluso si habla de consulta/honorarios.
  if (factura.hasStrongBillingStructure || factura.score >= 3) return "FACTURA";

  // Informe/receta no puede convivir con estructura de cobro.
  if (!hasBillingForInformeBlock && informe.score >= 2) return "INFORME_RECETA";

  // Evidencia adicional: señales de estudio/laboratorio, pero nunca si huele a factura
  // o si el texto parece informe/receta.
  if (!factura.hasFacturaSmell && informe.score < 2 && (evidencia.isImage || evidencia.score >= 1)) {
    return "EVIDENCIA_ADICIONAL";
  }

  return "INDETERMINADO";
}

function getSlotErrorDetail(slot: ExpectedSlot): string {
  if (slot === "FACTURA") return "El documento no corresponde a una factura válida.";
  if (slot === "INFORME_RECETA")
    return "El documento no corresponde a un informe o receta médica.";
  return "El documento no corresponde a evidencia médica adicional.";
}

async function validateImageBySlot(file: File, expectedSlot: ExpectedSlot): Promise<ValidationResult> {
  const analysis = await analyzeImage(file);

  if (expectedSlot === "FACTURA") {
    if (analysis.kind === "DOCUMENTO_ESCANEADO") {
      return { isValid: true, detectedType: "FACTURA", errorDetail: null };
    }
    return {
      isValid: false,
      detectedType: "EVIDENCIA_ADICIONAL",
      errorDetail: getSlotErrorDetail("FACTURA")
    };
  }

  if (expectedSlot === "INFORME_RECETA") {
    if (analysis.kind === "DOCUMENTO_ESCANEADO") {
      return { isValid: true, detectedType: "INFORME_RECETA", errorDetail: null };
    }
    return {
      isValid: false,
      detectedType: "EVIDENCIA_ADICIONAL",
      errorDetail: getSlotErrorDetail("INFORME_RECETA")
    };
  }

  // EVIDENCIA_ADICIONAL: aceptar tanto imagen diagnostica como documento escaneado
  // por tolerancia demo (estudios o reportes escaneados).
  return {
    isValid: true,
    detectedType: "EVIDENCIA_ADICIONAL",
    errorDetail: null
  };
}

export async function validateDocumentBySlot(
  file: File,
  extractedText: string,
  expectedSlot: ExpectedSlot
): Promise<ValidationResult> {
  if (file.type.startsWith("image/")) {
    return validateImageBySlot(file, expectedSlot);
  }

  const text = normalizeText(extractedText || "");
  const hasText = text.trim().length > 0;

  // Demo tolerante: sin texto extraible no bloquea por contenido.
  if (!hasText) {
    return {
      isValid: true,
      detectedType: expectedSlot,
      errorDetail: null
    };
  }

  const detectedType = getDetectedType(file, text);
  const isExpectedByText = detectedType === expectedSlot;

  if (isExpectedByText) {
    return {
      isValid: true,
      detectedType: expectedSlot,
      errorDetail: null
    };
  }

  return {
    isValid: false,
    detectedType,
    errorDetail: getSlotErrorDetail(expectedSlot)
  };
}

export async function validateForSlot(
  file: File,
  expectedSlot: ExpectedSlot,
  extractedText = ""
): Promise<ValidationResult> {
  return validateDocumentBySlot(file, extractedText, expectedSlot);
}
