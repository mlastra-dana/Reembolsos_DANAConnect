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

function hasCurrencySymbol(text: string): boolean {
  return /(^|[\s:])(\$|S\/|USD|EUR|BS|B\/\.|RD\$|MXN|COP|PEN|VES|ARS|CLP)([\s\d]|$)/.test(text);
}

function hasAmount(text: string): boolean {
  return /\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})\b/.test(text);
}

function getFacturaSignals(text: string) {
  const header = hasAny(text, [
    "FACTURA",
    "RECIBO",
    "COMPROBANTE",
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
  const amount = hasAmount(text) || hasCurrencySymbol(text);

  const positives = [header, fiscalId, totals, billingStructure, honorarios, amount].filter(Boolean)
    .length;
  const hasStrongBillingStructure =
    (header && totals) || (totals && fiscalId && amount) || (header && fiscalId);

  return {
    header,
    fiscalId,
    totals,
    billingStructure,
    honorarios,
    amount,
    positives,
    hasStrongBillingStructure
  };
}

function getInformeSignals(text: string) {
  const diagnostico = hasAny(text, [
    "DIAGNOSTICO",
    "IMPRESION DIAGNOSTICA",
    "PLAN",
    "EVOLUCION"
  ]);
  const receta = hasAny(text, ["RECETA", "PRESCRIPCION", "INDICACIONES", "DOSIS", "TRATAMIENTO", "RP/"]);
  const medico = hasAny(text, ["DR", "DRA", "FIRMA", "CMP", "COLEGIATURA", "COLEGIADO"]);
  const patient = hasAny(text, ["PACIENTE", "NOMBRE DEL PACIENTE", "PACIENTE:"]);
  const positives = [diagnostico, receta, medico, patient].filter(Boolean).length;

  return { diagnostico, receta, medico, patient, positives };
}

function getEvidenciaSignals(text: string) {
  const imageKeywords = hasAny(text, [
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
  const labStructure = hasAny(text, ["VALOR", "REFERENCIA", "RANGO", "UNIDADES"]) ||
    /\b(MG\/DL|G\/DL|MMOL\/L|UI\/L|%|X10\^?\d)\b/.test(text);
  const positives = [imageKeywords, laboratorio, hallazgos, labStructure].filter(Boolean).length;
  return { imageKeywords, laboratorio, hallazgos, labStructure, positives };
}

function getDetectedType(file: File, text: string): ExpectedSlot | "INDETERMINADO" {
  const facturaSignals = getFacturaSignals(text);
  const informeSignals = getInformeSignals(text);
  const evidenciaSignals = getEvidenciaSignals(text);
  const recetaOnlyPenalty = hasAny(text, [
    "PRESCRIPCION",
    "RECETA",
    "INDICACIONES",
    "DOSIS",
    "TRATAMIENTO",
    "RP/"
  ]);

  const facturaLikely =
    facturaSignals.hasStrongBillingStructure ||
    (facturaSignals.positives >= 3 && (!recetaOnlyPenalty || facturaSignals.totals || facturaSignals.header));
  if (facturaLikely) return "FACTURA";

  const hasBillingInText =
    facturaSignals.totals || facturaSignals.header || (facturaSignals.fiscalId && facturaSignals.amount);
  const informeLikely = informeSignals.positives >= 2 && !hasBillingInText;
  if (informeLikely) return "INFORME_RECETA";

  const isImage = file.type.startsWith("image/");
  const evidenciaLikely =
    !hasBillingInText &&
    (isImage || evidenciaSignals.positives >= 1 || (evidenciaSignals.laboratorio && evidenciaSignals.labStructure));
  if (evidenciaLikely) return "EVIDENCIA_ADICIONAL";

  return "INDETERMINADO";
}

function getSlotErrorDetail(slot: ExpectedSlot): string {
  if (slot === "FACTURA") return "El documento no corresponde a una factura válida.";
  if (slot === "INFORME_RECETA")
    return "El documento no corresponde a un informe o receta médica.";
  return "El documento no corresponde a evidencia médica adicional.";
}

export function validateDocumentBySlot(
  file: File,
  extractedText: string,
  expectedSlot: ExpectedSlot
): ValidationResult {
  const text = normalizeText(extractedText || "");
  const detectedType = getDetectedType(file, text);

  if (detectedType === expectedSlot) {
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
