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

function scoreFactura(text: string): number {
  const groups = [
    hasAny(text, ["FACTURA", "BOLETA", "RECIBO", "COMPROBANTE"]),
    hasAny(text, ["TOTAL", "SUBTOTAL"]),
    hasAny(text, ["RUC", "RIF", "NIT"]),
    hasCurrency(text)
  ];
  return groups.filter(Boolean).length;
}

function scoreInformeReceta(text: string): number {
  const groups = [
    hasAny(text, ["RECETA", "PRESCRIPCION", "INDICACIONES"]),
    hasAny(text, ["DIAGNOSTICO", "INFORME"]),
    hasAny(text, ["DR.", "DR ", "CMP", "COLEGIADO"]),
    hasAny(text, ["PACIENTE", "NOMBRE DEL PACIENTE", "PACIENTE:"])
  ];
  return groups.filter(Boolean).length;
}

function scoreEvidencia(text: string): number {
  const groups = [
    hasAny(text, ["RADIOGRAFIA", "ECOGRAFIA", "ULTRASONIDO"]),
    hasAny(text, ["LABORATORIO", "RESULTADO"]),
    hasAny(text, ["RESONANCIA", "TOMOGRAFIA"]),
    hasAny(text, ["HALLAZGOS"])
  ];
  return groups.filter(Boolean).length;
}

function getDetectedType(text: string): ExpectedSlot | "INDETERMINADO" {
  const factura = scoreFactura(text);
  const informe = scoreInformeReceta(text);
  const evidencia = scoreEvidencia(text);
  const maxScore = Math.max(factura, informe, evidencia);

  if (maxScore <= 0) return "INDETERMINADO";
  if (factura === maxScore && factura >= 2) return "FACTURA";
  if (informe === maxScore && informe >= 2) return "INFORME_RECETA";
  if (evidencia === maxScore && evidencia >= 1) return "EVIDENCIA_ADICIONAL";
  return "INDETERMINADO";
}

function hasFilenameClue(filename: string, slot: ExpectedSlot): boolean {
  const normalized = normalizeText(filename);
  const bySlot: Record<ExpectedSlot, string[]> = {
    FACTURA: ["FACTURA", "BOLETA", "RECIBO", "COMPROBANTE", "TICKET", "PAGO"],
    INFORME_RECETA: ["INFORME", "RECETA", "PRESCRIP", "MEDICO", "ORDEN"],
    EVIDENCIA_ADICIONAL: ["RX", "RADIO", "ECOGRAF", "ULTRA", "LAB", "RESULTADO", "RESONANC", "TOMOGRAF"]
  };
  return hasAny(normalized, bySlot[slot]);
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
  const detectedType = getDetectedType(text);
  const filenameClue = hasFilenameClue(file.name, expectedSlot);
  const textWordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const textIsScarce = textWordCount < 6;

  const isExpectedByText =
    (expectedSlot === "FACTURA" && scoreFactura(text) >= 2) ||
    (expectedSlot === "INFORME_RECETA" && scoreInformeReceta(text) >= 2) ||
    (expectedSlot === "EVIDENCIA_ADICIONAL" && scoreEvidencia(text) >= 1);

  if (isExpectedByText) {
    return {
      isValid: true,
      detectedType: expectedSlot,
      errorDetail: null
    };
  }

  // Modo demo tolerante: aceptar cuando hay poco texto pero nombre de archivo da pista
  if (textIsScarce && filenameClue && (detectedType === "INDETERMINADO" || detectedType === expectedSlot)) {
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
